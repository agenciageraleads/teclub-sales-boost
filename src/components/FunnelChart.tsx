import { Lead, LeadStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

interface FunnelChartProps {
  leads: Lead[];
}

const funnelStages: { status: LeadStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'Novo', label: 'Novo', color: 'bg-blue-500', bgColor: 'bg-blue-500/10' },
  { status: 'Em Atendimento', label: 'Em Atendimento', color: 'bg-amber-500', bgColor: 'bg-amber-500/10' },
  { status: 'Ganho', label: 'Ganho', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/10' },
];

export function FunnelChart({ leads }: FunnelChartProps) {
  const data = funnelStages.map(stage => {
    const stageLeads = leads.filter(l => l.status === stage.status);
    const count = stageLeads.length;
    const totalValue = stageLeads.reduce((acc, l) => acc + (l.valor_fechamento || 0), 0);
    return { ...stage, count, totalValue };
  });

  const maxCount = Math.max(...data.map(c => c.count), 1);

  return (
    <div className="space-y-4">
      {data.map((stage, index) => {
        const width = Math.max((stage.count / maxCount) * 100, 15);
        
        return (
          <div 
            key={stage.status} 
            className="animate-slide-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{stage.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">{stage.count}</span>
                {stage.totalValue > 0 && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <DollarSign className="w-3 h-3" />
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      maximumFractionDigits: 0 
                    }).format(stage.totalValue)}
                  </span>
                )}
              </div>
            </div>
            <div className={cn('h-12 rounded-lg overflow-hidden', stage.bgColor)}>
              <div 
                className={cn('h-full rounded-lg transition-all duration-500 flex items-center justify-center', stage.color)}
                style={{ width: `${width}%` }}
              >
                {stage.count > 0 && (
                  <span className="text-white text-sm font-medium">{stage.count}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
