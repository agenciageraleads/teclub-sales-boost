import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface LeadInput {
  nome: string;
  contato: string;
  status?: string;
  vendedor_id?: string;
  valor_fechamento?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API Key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('N8N_API_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('Received body:', JSON.stringify(body));

    // Accept single lead or array of leads
    const leads: LeadInput[] = Array.isArray(body) ? body : [body];

    // Validate required fields
    const errors: string[] = [];
    leads.forEach((lead, index) => {
      if (!lead.nome || typeof lead.nome !== 'string') {
        errors.push(`Lead ${index}: 'nome' is required and must be a string`);
      }
      if (!lead.contato || typeof lead.contato !== 'string') {
        errors.push(`Lead ${index}: 'contato' is required and must be a string`);
      }
    });

    if (errors.length > 0) {
      console.error('Validation errors:', errors);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare leads for insertion
    const leadsToInsert = leads.map(lead => ({
      nome: lead.nome.trim(),
      contato: lead.contato.trim(),
      status: lead.status || 'Novo',
      vendedor_id: lead.vendedor_id || null,
      valor_fechamento: lead.valor_fechamento || null,
    }));

    console.log('Inserting leads:', JSON.stringify(leadsToInsert));

    // Insert leads
    const { data, error } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert leads', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully inserted leads:', data?.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${data?.length} lead(s) imported successfully`,
        leads: data 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
