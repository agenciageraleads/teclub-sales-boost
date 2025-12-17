import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { KPICard } from '@/components/KPICard';
import { FunnelChart } from '@/components/FunnelChart';
import { Lead, Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function GestorDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendedores, setVendedores] = useState<Profile[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all leads
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch vendedores (users with vendedor role)
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'vendedor');

    if (rolesData && rolesData.length > 0) {
      const vendedorIds = rolesData.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', vendedorIds);
      
      if (profilesData) {
        setVendedores(profilesData as Profile[]);
      }
    }

    if (leadsData) {
      setLeads(leadsData as Lead[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLeads = selectedVendedor === 'all' 
    ? leads 
    : leads.filter(l => l.vendedor_id === selectedVendedor);

  // Calculate KPIs
  const totalLeads = filteredLeads.length;
  const leadsGanhos = filteredLeads.filter(l => l.status === 'Ganho').length;
  const taxaConversao = totalLeads > 0 ? ((leadsGanhos / totalLeads) * 100).toFixed(1) : '0';
  const valorTotal = filteredLeads
    .filter(l => l.status === 'Ganho' && l.valor_fechamento)
    .reduce((acc, l) => acc + (l.valor_fechamento || 0), 0);
  const valorEmNegociacao = filteredLeads
    .filter(l => l.status === 'Em Atendimento' && l.valor_fechamento)
    .reduce((acc, l) => acc + (l.valor_fechamento || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral do funil de vendas</p>
          </div>

          <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar por vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os vendedores</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.full_name || v.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <KPICard
                title="Total de Leads"
                value={totalLeads}
                icon={Users}
              />
              <KPICard
                title="Taxa de Conversão"
                value={`${taxaConversao}%`}
                icon={TrendingUp}
              />
              <KPICard
                title="Valor Fechado"
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                icon={DollarSign}
              />
              <KPICard
                title="Em Negociação"
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorEmNegociacao)}
                icon={Target}
              />
            </div>

            {/* Funnel Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pipeline de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <FunnelChart leads={filteredLeads} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
