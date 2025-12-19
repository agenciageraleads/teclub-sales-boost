import { Lead } from '@/types/database';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { Users, Clock, CheckCircle2 } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  onUpdate: () => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  filter: (lead: Lead) => boolean;
}

const columns: KanbanColumn[] = [
  {
    id: 'novo',
    title: 'Novo',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    filter: (lead) => lead.status === 'Novo',
  },
  {
    id: 'em-atendimento',
    title: 'Em Atendimento',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    filter: (lead) => lead.status === 'Em Atendimento',
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    filter: (lead) => lead.status === 'Ganho' || lead.status === 'Perdido',
  },
];

export function KanbanBoard({ leads, onUpdate }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => {
        const columnLeads = leads.filter(column.filter);
        const ganhos = columnLeads.filter(l => l.status === 'Ganho').length;
        const perdidos = columnLeads.filter(l => l.status === 'Perdido').length;

        return (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className={cn('rounded-t-lg p-3 border border-b-0', column.bgColor)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <column.icon className={cn('w-4 h-4', column.color)} />
                  <h3 className={cn('font-semibold text-sm', column.color)}>{column.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    column.bgColor,
                    column.color
                  )}>
                    {columnLeads.length}
                  </span>
                  {column.id === 'finalizado' && (
                    <div className="flex gap-1 text-xs">
                      <span className="text-emerald-600">✓{ganhos}</span>
                      <span className="text-red-600">✗{perdidos}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 bg-muted/30 rounded-b-lg border border-t-0 p-2 min-h-[400px] space-y-2 overflow-y-auto max-h-[600px]">
              {columnLeads.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                  Nenhum lead
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <KanbanCard key={lead.id} lead={lead} onUpdate={onUpdate} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
