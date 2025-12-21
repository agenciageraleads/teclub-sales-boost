import { useState } from 'react';
import { Lead, LeadStatus } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, DollarSign, Calendar, Check, X, Send, Ban, FileText, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OrcamentoModal } from './OrcamentoModal';
import { MotivoModal } from './MotivoModal';

interface KanbanCardProps {
  lead: Lead;
  onUpdate: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onLeadClick?: () => void;
}

const statusConfig: Record<LeadStatus, { label: string; class: string }> = {
  'Novo': { label: 'Novo', class: 'status-novo' },
  'Em Atendimento': { label: 'Em Atendimento', class: 'status-atendimento' },
  'Ganho': { label: 'Ganho', class: 'status-ganho' },
  'Perdido': { label: 'Perdido', class: 'status-perdido' },
};

export function KanbanCard({ lead, onUpdate, onDragStart, onLeadClick }: KanbanCardProps) {
  const [orcamentoOpen, setOrcamentoOpen] = useState(false);
  const [motivoOpen, setMotivoOpen] = useState(false);
  const [ganhoModalOpen, setGanhoModalOpen] = useState(false);

  const status = statusConfig[lead.status];

  const handleEnviarOrcamento = async (valor: number) => {
    const { error } = await supabase
      .from('leads')
      .update({ valor_fechamento: valor, status: 'Em Atendimento' as LeadStatus })
      .eq('id', lead.id);

    if (error) {
      toast.error('Erro ao enviar orçamento');
      return;
    }
    toast.success('Orçamento enviado! Lead movido para Em Atendimento');
    onUpdate();
  };

  const handleGanho = async (valor: number) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: 'Ganho' as LeadStatus, valor_fechamento: valor })
      .eq('id', lead.id);

    if (error) {
      toast.error('Erro ao marcar como ganho');
      return;
    }
    toast.success('Lead marcado como Ganho!');
    onUpdate();
  };

  const handlePerdido = async (motivo: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: 'Perdido' as LeadStatus, motivo_perda: motivo })
      .eq('id', lead.id);

    if (error) {
      toast.error('Erro ao marcar como perdido');
      return;
    }
    toast.success('Lead marcado como Perdido');
    onUpdate();
  };

  const handleDesqualificar = async () => {
    const { error } = await supabase
      .from('leads')
      .update({ status: 'Perdido' as LeadStatus, motivo_perda: 'Desqualificado' })
      .eq('id', lead.id);

    if (error) {
      toast.error('Erro ao desqualificar lead');
      return;
    }
    toast.success('Lead desqualificado');
    onUpdate();
  };

  const isNovo = lead.status === 'Novo';
  const isEmAtendimento = lead.status === 'Em Atendimento';
  const isFinalizado = lead.status === 'Ganho' || lead.status === 'Perdido';

  return (
    <>
      <Card 
        className={cn(
          'animate-fade-in hover:shadow-lg transition-all duration-300 border-border/50 cursor-grab active:cursor-grabbing',
          lead.status === 'Ganho' && 'border-l-4 border-l-emerald-500',
          lead.status === 'Perdido' && 'border-l-4 border-l-red-500'
        )}
        draggable
        onDragStart={onDragStart}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 
              className="font-semibold text-foreground text-sm truncate flex-1 cursor-pointer hover:text-primary transition-colors"
              onClick={onLeadClick}
            >
              {lead.nome}
            </h3>
            <Badge variant="outline" className={cn('shrink-0 border text-xs', status.class)}>
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
            <Phone className="w-3 h-3" />
            <span className="truncate">{lead.contato}</span>
          </div>

          {lead.demanda && (
            <div className="flex items-start gap-1.5 text-muted-foreground text-xs mb-2">
              <FileText className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{lead.demanda}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
            {lead.valor_fechamento && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span className="font-medium text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fechamento)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(lead.created_at), 'dd MMM', { locale: ptBR })}</span>
            </div>
            {lead.origem && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>{lead.origem}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!isFinalizado && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {isNovo && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8 gap-1 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setOrcamentoOpen(true)}
                  >
                    <Send className="w-3 h-3" />
                    Orçamento
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 gap-1 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    onClick={handleDesqualificar}
                  >
                    <Ban className="w-3 h-3" />
                  </Button>
                </>
              )}
              {isEmAtendimento && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8 gap-1 hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                    onClick={() => setGanhoModalOpen(true)}
                  >
                    <Check className="w-3 h-3" />
                    Ganho
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8 gap-1 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    onClick={() => setMotivoOpen(true)}
                  >
                    <X className="w-3 h-3" />
                    Perdido
                  </Button>
                </>
              )}
            </div>
          )}

          {lead.motivo_perda && (
            <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 line-clamp-2">
              {lead.motivo_perda}
            </p>
          )}
        </CardContent>
      </Card>

      <OrcamentoModal
        open={orcamentoOpen}
        onOpenChange={setOrcamentoOpen}
        onConfirm={handleEnviarOrcamento}
        title="Enviar Orçamento"
      />

      <OrcamentoModal
        open={ganhoModalOpen}
        onOpenChange={setGanhoModalOpen}
        onConfirm={handleGanho}
        title="Confirmar Valor de Fechamento"
        currentValue={lead.valor_fechamento}
      />

      <MotivoModal
        open={motivoOpen}
        onOpenChange={setMotivoOpen}
        onConfirm={handlePerdido}
      />
    </>
  );
}
