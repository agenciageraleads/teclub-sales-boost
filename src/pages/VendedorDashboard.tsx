import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { KanbanBoard } from '@/components/KanbanBoard';
import { DateFilterToggle, DateFilter } from '@/components/DateFilterToggle';
import { Lead } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';

export default function VendedorDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

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
    
    const dateRangeStart = getDateFilterRange(dateFilter);
    const matchesDate = !dateRangeStart || new Date(lead.created_at) >= dateRangeStart;
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Minhas Oportunidades</h1>
          <p className="text-muted-foreground mt-1 text-base">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="🔍 Buscar por nome ou contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 text-base"
            />
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
          <KanbanBoard leads={filteredLeads} onUpdate={fetchLeads} />
        )}
      </main>
    </div>
  );
}
