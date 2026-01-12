import { useState, useEffect } from 'react';
import { Lead, LeadStatus, FollowupTemplate } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, DollarSign, Calendar, Check, X, Send, Ban, FileText, Tag, MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OrcamentoModal } from './OrcamentoModal';
import { MotivoModal } from './MotivoModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [templates, setTemplates] = useState<FollowupTemplate[]>([]);

  const status = statusConfig[lead.status];

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('followup_templates')
        .select('*')
        .order('nome');
      if (data) setTemplates(data);
    };
    fetchTemplates();
  }, []);

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

  const handleFollowUp = async (template?: FollowupTemplate) => {
    // Atualizar ultimo_contato
    await supabase
      .from('leads')
      .update({ ultimo_contato: new Date().toISOString() })
      .eq('id', lead.id);
    
    // Formatar número de telefone (remover caracteres não numéricos)
    const phone = lead.contato.replace(/\D/g, '');
    
    // Mensagem padrão ou do template
    let message = template 
      ? template.mensagem.replace('{nome}', lead.nome).replace('{contato}', lead.contato)
      : `Olá ${lead.nome}, tudo bem? Gostaria de dar continuidade ao nosso atendimento. Posso te ajudar?`;
    
    // Encode da mensagem
    const encodedMessage = encodeURIComponent(message);
    
    // Abrir WhatsApp Web
    window.open(`https://web.whatsapp.com/send?phone=55${phone}&text=${encodedMessage}`, '_blank');
    
    toast.success('WhatsApp aberto! Último contato atualizado.');
    onUpdate();
  };

  const isNovo = lead.status === 'Novo';
  const isEmAtendimento = lead.status === 'Em Atendimento';
  const isFinalizado = lead.status === 'Ganho' || lead.status === 'Perdido';

  return (
    <>
      <Card 
        className={cn(
          'animate-fade-in hover:shadow-md transition-all duration-200 border-border/50 cursor-grab active:cursor-grabbing',
          lead.status === 'Ganho' && 'border-l-4 border-l-emerald-500',
          lead.status === 'Perdido' && 'border-l-4 border-l-red-500'
        )}
        draggable
        onDragStart={onDragStart}
      >
        <CardContent className="p-2.5">
          {/* Header row - Name + Status + Actions */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 
              className="font-medium text-foreground text-sm truncate flex-1 cursor-pointer hover:text-primary transition-colors"
              onClick={onLeadClick}
            >
              {lead.nome}
            </h3>
            <div className="flex items-center gap-1.5">
              {isEmAtendimento && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 w-5 p-0 bg-blue-500/10 border-blue-500/30 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                        title="Enviar Follow-up"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleFollowUp()}>
                        Mensagem Padrão
                      </DropdownMenuItem>
                      {templates.map((template) => (
                        <DropdownMenuItem key={template.id} onClick={() => handleFollowUp(template)}>
                          {template.nome}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 w-5 p-0 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                    onClick={() => setGanhoModalOpen(true)}
                    title="Marcar como Ganho"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 w-5 p-0 bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500"
                    onClick={() => setMotivoOpen(true)}
                    title="Marcar como Perdido"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              )}
              <Badge variant="outline" className={cn('shrink-0 border text-[10px] px-1.5 py-0', status.class)}>
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Info row - Contact, Value, Date, Origin */}
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{lead.contato}</span>
            </div>
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
              <span>{format(new Date(lead.created_at), 'dd/MM', { locale: ptBR })}</span>
            </div>
            {lead.ultimo_contato && (
              <div className="flex items-center gap-1 text-blue-600" title="Último contato">
                <Clock className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(lead.ultimo_contato), { locale: ptBR, addSuffix: true })}</span>
              </div>
            )}
            {lead.origem && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>{lead.origem}</span>
              </div>
            )}
          </div>

          {/* Demanda row (if exists) */}
          {lead.demanda && (
            <div className="flex items-start gap-1 text-muted-foreground text-xs mb-1.5">
              <FileText className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{lead.demanda}</span>
            </div>
          )}

          {/* Actions row - only for Novo status */}
          {isNovo && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2 gap-1 hover:bg-accent hover:text-accent-foreground"
                onClick={() => setOrcamentoOpen(true)}
              >
                <Send className="w-3 h-3" />
                Orçamento
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                onClick={handleDesqualificar}
              >
                <Ban className="w-3 h-3" />
              </Button>
            </div>
          )}

          {lead.motivo_perda && (
            <p className="mt-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-1 line-clamp-1">
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