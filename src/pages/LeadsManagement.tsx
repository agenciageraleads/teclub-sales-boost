import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ImportLeadsModal } from '@/components/ImportLeadsModal';
import { DateFilterToggle, DateFilter } from '@/components/DateFilterToggle';
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
import { startOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';

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
            <p className="text-muted-foreground mt-1 text-base">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2 h-11">
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2 h-11">
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="🔍 Buscar por nome ou contato..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
              <SelectTrigger className="w-full sm:w-56 h-11">
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
          
          {/* Date filter as toggle buttons */}
          <DateFilterToggle value={dateFilter} onChange={setDateFilter} />
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
            <DialogTitle className="text-xl">Novo Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-base">Nome</Label>
              <Input id="nome" name="nome" placeholder="Nome do lead" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contato" className="text-base">Contato</Label>
              <Input id="contato" name="contato" placeholder="Telefone ou email" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendedor" className="text-base">Vendedor Responsável</Label>
              <Select name="vendedor" required>
                <SelectTrigger className="h-11">
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
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="h-11">
                Cancelar
              </Button>
              <Button type="submit" disabled={creating} className="h-11">
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
