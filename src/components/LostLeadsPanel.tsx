import { Lead } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, AlertTriangle } from 'lucide-react';

interface LostLeadsPanelProps {
  leads: Lead[];
}

export function LostLeadsPanel({ leads }: LostLeadsPanelProps) {
  const lostLeads = leads.filter(l => l.status === 'Perdido');
  
  const totalLostValue = lostLeads.reduce(
    (acc, l) => acc + (l.valor_fechamento || 0),
    0
  );

  // Count loss reasons
  const reasonCounts = lostLeads.reduce((acc, lead) => {
    const reason = lead.motivo_perda || 'Não informado';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort by count and get top 5
  const topReasons = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <TrendingDown className="w-5 h-5" />
          Leads Perdidos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Lost Value */}
        <div className="bg-red-500/10 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Valor Total Perdido</p>
          <p className="text-2xl font-bold text-red-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalLostValue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {lostLeads.length} lead{lostLeads.length !== 1 ? 's' : ''} perdido{lostLeads.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Top Loss Reasons */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Top Motivos de Perda
          </h4>
          {topReasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum motivo registrado</p>
          ) : (
            <div className="space-y-2">
              {topReasons.map(([reason, count], index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted/50 rounded-lg p-2"
                >
                  <span className="text-sm text-foreground truncate flex-1 mr-2">
                    {reason}
                  </span>
                  <span className="text-xs font-medium bg-red-500/10 text-red-600 px-2 py-1 rounded-full shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
