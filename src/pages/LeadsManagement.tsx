import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { LeadCard } from '@/components/LeadCard';
import { LeadStatusModal } from '@/components/LeadStatusModal';
import { ImportLeadsModal } from '@/components/ImportLeadsModal';
import { Lead, LeadStatus, Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const statusOptions: (LeadStatus | 'Todos')[] = ['Todos', 'Novo', 'Em Atendimento', 'Ganho', 'Perdido'];

export default function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendedores, setVendedores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'Todos'>('Todos');
  const [vendedorFilter, setVendedorFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(search.toLowerCase()) ||
                          lead.contato.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;
    const matchesVendedor = vendedorFilter === 'all' || lead.vendedor_id === vendedorFilter;
    return matchesSearch && matchesStatus && matchesVendedor;
  });

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get('nome') as string;
    const contato = formData.get('contato') as string;
    const vendedorId = formData.get('vendedor') as string;

    if (!nome || !contato || !vendedorId) {
      toast.error('Preencha todos os campos');
      return;
    }

    setCreating(true);
    const { error } = await supabase.from('leads').insert({
      nome: nome.trim(),
      contato: contato.trim(),
      vendedor_id: vendedorId,
      status: 'Novo' as LeadStatus,
    });
    setCreating(false);

    if (error) {
      toast.error('Erro ao criar lead');
      return;
    }

    toast.success('Lead criado com sucesso!');
    setCreateModalOpen(false);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Leads</h1>
            <p className="text-muted-foreground mt-1">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </div>
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
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Vendedor" />
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
        onSuccess={fetchData}
      />

      {/* Create Lead Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" placeholder="Nome do lead" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contato">Contato</Label>
              <Input id="contato" name="contato" placeholder="Telefone ou email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendedor">Vendedor Responsável</Label>
              <Select name="vendedor" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.full_name || v.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImportLeadsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        vendedores={vendedores}
        onSuccess={fetchData}
      />
    </div>
  );
}
