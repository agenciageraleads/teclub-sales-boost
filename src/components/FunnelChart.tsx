import { Lead, LeadStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface FunnelChartProps {
  leads: Lead[];
}

const funnelStages: { status: LeadStatus; color: string; bgColor: string }[] = [
  { status: 'Novo', color: 'bg-blue-500', bgColor: 'bg-blue-500/10' },
  { status: 'Em Atendimento', color: 'bg-amber-500', bgColor: 'bg-amber-500/10' },
  { status: 'Ganho', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/10' },
  { status: 'Perdido', color: 'bg-red-500', bgColor: 'bg-red-500/10' },
];

export function FunnelChart({ leads }: FunnelChartProps) {
  const counts = funnelStages.map(stage => ({
    ...stage,
    count: leads.filter(l => l.status === stage.status).length,
  }));

  const maxCount = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="space-y-3">
      {counts.map((stage, index) => {
        const width = Math.max((stage.count / maxCount) * 100, 10);
        
        return (
          <div 
            key={stage.status} 
            className="animate-slide-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{stage.status}</span>
              <span className="text-sm font-semibold text-foreground">{stage.count}</span>
            </div>
            <div className={cn('h-10 rounded-lg overflow-hidden', stage.bgColor)}>
              <div 
                className={cn('h-full rounded-lg transition-all duration-500', stage.color)}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
