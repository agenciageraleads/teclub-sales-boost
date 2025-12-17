import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { LeadCard } from '@/components/LeadCard';
import { LeadStatusModal } from '@/components/LeadStatusModal';
import { Lead, LeadStatus } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const statusOptions: (LeadStatus | 'Todos')[] = ['Todos', 'Novo', 'Em Atendimento', 'Ganho', 'Perdido'];

export default function VendedorDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'Todos'>('Todos');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchLeads = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('vendedor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data as Lead[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(search.toLowerCase()) ||
                          lead.contato.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Meus Leads</h1>
          <p className="text-muted-foreground mt-1">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | 'Todos')}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onEdit={handleEditLead} />
            ))}
          </div>
        )}
      </main>

      <LeadStatusModal
        lead={selectedLead}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
