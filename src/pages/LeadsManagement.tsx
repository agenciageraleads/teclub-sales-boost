import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ImportLeadsModal } from '@/components/ImportLeadsModal';
import { Lead, LeadStatus, Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Upload, Calendar } from 'lucide-react';
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
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';

type DateFilter = 'all' | 'today' | 'week' | 'month' | '7days' | '30days';

export default function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendedores, setVendedores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vendedorFilter, setVendedorFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
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

  const getDateFilterRange = (filter: DateFilter): Date | null => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return startOfDay(now);
      case 'week':
        return startOfWeek(now, { weekStartsOn: 1 });
      case 'month':
        return startOfMonth(now);
      case '7days':
        return subDays(now, 7);
      case '30days':
        return subDays(now, 30);
      default:
        return null;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(search.toLowerCase()) ||
                          lead.contato.toLowerCase().includes(search.toLowerCase());
    const matchesVendedor = vendedorFilter === 'all' || lead.vendedor_id === vendedorFilter;
    
    const dateRangeStart = getDateFilterRange(dateFilter);
    const matchesDate = !dateRangeStart || new Date(lead.created_at) >= dateRangeStart;
    
    return matchesSearch && matchesVendedor && matchesDate;
  });

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
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-lg" />
            ))}
          </div>
        ) : (
          <KanbanBoard leads={filteredLeads} onUpdate={fetchData} />
        )}
      </main>

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
