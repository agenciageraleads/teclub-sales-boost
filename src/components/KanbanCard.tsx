import { useState, useEffect } from 'react';
import { Lead, LeadStatus, FollowupTemplate } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, DollarSign, Calendar, Check, X, Ban, FileText, Tag, MessageCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    toast.success('🎉 Orçamento enviado! Lead movido para Em Atendimento');
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
    toast.success('🎉 Parabéns! Venda realizada com sucesso!', {
      duration: 5000,
    });
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
    toast.info('Lead marcado como Perdido');
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
    toast.info('Lead desqualificado');
    onUpdate();
  };

  const handleFollowUp = async (template?: FollowupTemplate) => {
    await supabase
      .from('leads')
      .update({ ultimo_contato: new Date().toISOString() })
      .eq('id', lead.id);
    
    const phone = lead.contato.replace(/\D/g, '');
    
    let message = template 
      ? template.mensagem.replace('{nome}', lead.nome).replace('{contato}', lead.contato)
      : `Olá ${lead.nome}, tudo bem? Gostaria de dar continuidade ao nosso atendimento. Posso te ajudar?`;
    
    const encodedMessage = encodeURIComponent(message);
    
    window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodedMessage}`, '_blank');
    
    toast.success('WhatsApp aberto! Último contato atualizado.');
    onUpdate();
  };

  const handleLigar = () => {
    const phone = lead.contato.replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=55${phone}`, '_blank');
  };

  const isNovo = lead.status === 'Novo';
  const isEmAtendimento = lead.status === 'Em Atendimento';
  const isFinalizado = lead.status === 'Ganho' || lead.status === 'Perdido';

  return (
    <>
      <Card 
        className={cn(
          'animate-fade-in hover:shadow-md transition-all duration-200 border-border/50 cursor-grab active:cursor-grabbing',
          lead.status === 'Ganho' && 'border-l-4 border-l-emerald-500 bg-emerald-50/30',
          lead.status === 'Perdido' && 'border-l-4 border-l-red-500 bg-red-50/30'
        )}
        draggable
        onDragStart={onDragStart}
      >
        <CardContent className="p-4">
          {/* Header - Nome e Status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 
              className="font-semibold text-foreground text-base truncate flex-1 cursor-pointer hover:text-primary transition-colors"
              onClick={onLeadClick}
            >
              {lead.nome}
            </h3>
            <Badge variant="outline" className={cn('shrink-0 border text-xs px-2 py-0.5', status.class)}>
              {status.label}
            </Badge>
          </div>

          {/* Telefone clicável - GRANDE e destacado */}
          <Button
            variant="outline"
            className="w-full mb-3 h-11 text-base font-medium gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
            onClick={handleLigar}
          >
            <Phone className="w-5 h-5" />
            📞 LIGAR - {lead.contato}
          </Button>

          {/* Valor se existir */}
          {lead.valor_fechamento && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-700 text-base">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fechamento)}
              </span>
            </div>
          )}

          {/* Detalhes recolhíveis */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full h-8 text-sm text-muted-foreground hover:text-foreground mb-2">
                {detailsOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Ocultar detalhes
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Ver mais detalhes
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mb-3">
              <div className="text-sm text-muted-foreground space-y-1.5 bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Criado em: {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                {lead.ultimo_contato && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Clock className="w-4 h-4" />
                    <span>Último contato: {formatDistanceToNow(new Date(lead.ultimo_contato), { locale: ptBR, addSuffix: true })}</span>
                  </div>
                )}
                {lead.origem && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Origem: {lead.origem}</span>
                  </div>
                )}
                {lead.demanda && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <span>{lead.demanda}</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Botões de ação para NOVO */}
          {isNovo && (
            <div className="space-y-2">
              <Button
                className="w-full h-12 text-base font-semibold gap-2 bg-primary hover:bg-primary/90"
                onClick={() => setOrcamentoOpen(true)}
              >
                💰 ENVIAR ORÇAMENTO
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 text-sm gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={handleDesqualificar}
              >
                <Ban className="w-4 h-4" />
                ❌ Desqualificar
              </Button>
            </div>
          )}

          {/* Botões de ação para EM ATENDIMENTO */}
          {isEmAtendimento && (
            <div className="space-y-2">
              {/* Follow-up */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-11 text-base font-medium gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <MessageCircle className="w-5 h-5" />
                    📱 ENVIAR FOLLOW-UP
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem onClick={() => handleFollowUp()} className="text-base py-3">
                    Mensagem Padrão
                  </DropdownMenuItem>
                  {templates.map((template) => (
                    <DropdownMenuItem 
                      key={template.id} 
                      onClick={() => handleFollowUp(template)}
                      className="text-base py-3"
                    >
                      {template.nome}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Ganho e Perdido lado a lado */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-14 text-sm font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white flex-col py-2"
                  onClick={() => setGanhoModalOpen(true)}
                >
                  <Check className="w-5 h-5" />
                  <span>✅ GANHO</span>
                  <span className="text-[10px] font-normal opacity-80">Cliente Comprou</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-14 text-sm font-bold gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 flex-col py-2"
                  onClick={() => setMotivoOpen(true)}
                >
                  <X className="w-5 h-5" />
                  <span>❌ PERDIDO</span>
                  <span className="text-[10px] font-normal opacity-80">Cliente Desistiu</span>
                </Button>
              </div>
            </div>
          )}

          {/* Motivo da perda para leads finalizados */}
          {lead.motivo_perda && (
            <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
              <strong>Motivo:</strong> {lead.motivo_perda}
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
