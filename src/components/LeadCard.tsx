import { Lead, LeadStatus } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Edit2, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
}

const statusConfig: Record<LeadStatus, { label: string; class: string }> = {
  'Novo': { label: 'Novo', class: 'status-novo' },
  'Em Atendimento': { label: 'Em Atendimento', class: 'status-atendimento' },
  'Ganho': { label: 'Ganho', class: 'status-ganho' },
  'Perdido': { label: 'Perdido', class: 'status-perdido' },
};

export function LeadCard({ lead, onEdit }: LeadCardProps) {
  const status = statusConfig[lead.status];

  return (
    <Card className="group animate-fade-in hover:shadow-lg transition-all duration-300 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{lead.nome}</h3>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
              <Phone className="w-3.5 h-3.5" />
              <span className="truncate">{lead.contato}</span>
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0 border', status.class)}>
            {status.label}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {lead.valor_fechamento && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-status-ganho" />
                <span className="font-medium text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fechamento)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(lead.created_at), 'dd MMM', { locale: ptBR })}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(lead)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>

        {lead.motivo_perda && (
          <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-md p-2 line-clamp-2">
            {lead.motivo_perda}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
