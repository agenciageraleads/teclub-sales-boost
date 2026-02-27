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
  demanda?: string;
  origem?: string;
  motivo_perda?: string;
}

interface LeadUpdate {
  id: string;
  nome?: string;
  contato?: string;
  status?: string;
  vendedor_id?: string;
  valor_fechamento?: number;
  demanda?: string;
  origem?: string;
  motivo_perda?: string;
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

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const leadId = url.searchParams.get('id');

    // GET - Query leads
    if (req.method === 'GET') {
      let query = supabase.from('leads').select('*');

      // Filter by ID if provided
      if (leadId) {
        query = query.eq('id', leadId);
      }

      // Additional filters from query params
      const status = url.searchParams.get('status');
      const vendedor_id = url.searchParams.get('vendedor_id');
      const origem = url.searchParams.get('origem');
      const limit = url.searchParams.get('limit');

      if (status) query = query.eq('status', status);
      if (vendedor_id) query = query.eq('vendedor_id', vendedor_id);
      if (origem) query = query.eq('origem', origem);
      if (limit) query = query.limit(parseInt(limit));

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch leads', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, leads: data, count: data?.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT/PATCH - Update lead
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body: LeadUpdate = await req.json();
      console.log('Received update body:', JSON.stringify(body));

      const updateId = leadId || body.id;
      if (!updateId) {
        return new Response(
          JSON.stringify({ error: 'Lead ID is required for update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build update object (only include provided fields)
      const updateData: Record<string, any> = {};
      if (body.nome !== undefined) updateData.nome = body.nome;
      if (body.contato !== undefined) updateData.contato = body.contato;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.vendedor_id !== undefined) updateData.vendedor_id = body.vendedor_id;
      if (body.valor_fechamento !== undefined) updateData.valor_fechamento = body.valor_fechamento;
      if (body.demanda !== undefined) updateData.demanda = body.demanda;
      if (body.origem !== undefined) updateData.origem = body.origem;
      if (body.motivo_perda !== undefined) updateData.motivo_perda = body.motivo_perda;

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No fields to update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Updating lead:', updateId, 'with data:', JSON.stringify(updateData));

      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', updateId)
        .select();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update lead', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Successfully updated lead:', data[0].id);

      return new Response(
        JSON.stringify({ success: true, message: 'Lead updated successfully', lead: data[0] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete lead
    if (req.method === 'DELETE') {
      const deleteId = leadId || (await req.json().catch(() => ({}))).id;
      
      if (!deleteId) {
        return new Response(
          JSON.stringify({ error: 'Lead ID is required for deletion' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', deleteId);

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete lead', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Successfully deleted lead:', deleteId);

      return new Response(
        JSON.stringify({ success: true, message: 'Lead deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create leads
    if (req.method === 'POST') {
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

      // Prepare leads for insertion
      const leadsToInsert = leads.map(lead => ({
        nome: lead.nome.trim(),
        contato: lead.contato.trim(),
        status: lead.status || 'Novo',
        vendedor_id: lead.vendedor_id || null,
        valor_fechamento: lead.valor_fechamento || null,
        demanda: lead.demanda || null,
        origem: lead.origem || null,
        motivo_perda: lead.motivo_perda || null,
      }));

      // Deduplicate within the incoming batch
      const seen = new Set<string>();
      const uniqueLeads = leadsToInsert.filter(lead => {
        const key = `${lead.nome.toLowerCase()}|${lead.contato.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Check against existing leads in DB
      const { data: existing } = await supabase
        .from('leads')
        .select('nome, contato');

      const existingKeys = new Set(
        (existing || []).map(l => `${l.nome.trim().toLowerCase()}|${l.contato.trim().toLowerCase()}`)
      );

      const newLeads = uniqueLeads.filter(lead => {
        const key = `${lead.nome.toLowerCase()}|${lead.contato.toLowerCase()}`;
        return !existingKeys.has(key);
      });

      const duplicatesSkipped = leadsToInsert.length - newLeads.length;

      if (newLeads.length === 0) {
        console.log(`All ${leadsToInsert.length} leads are duplicates, skipping.`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'All leads already exist, none imported.',
            inserted: 0,
            duplicates_skipped: duplicatesSkipped,
            leads: [] 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Inserting ${newLeads.length} leads (${duplicatesSkipped} duplicates skipped)`);

      // Insert only new leads
      const { data, error } = await supabase
        .from('leads')
        .insert(newLeads)
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
          message: `${data?.length} lead(s) imported, ${duplicatesSkipped} duplicate(s) skipped`,
          inserted: data?.length,
          duplicates_skipped: duplicatesSkipped,
          leads: data 
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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