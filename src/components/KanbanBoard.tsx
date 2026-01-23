import { useState } from 'react';
import { Lead, LeadStatus } from '@/types/database';
import { KanbanCard } from './KanbanCard';
import { LeadDetailModal } from './LeadDetailModal';
import { OrcamentoModal } from './OrcamentoModal';
import { cn } from '@/lib/utils';
import { Users, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  acceptsStatus: LeadStatus[];
}

const columns: KanbanColumn[] = [
  {
    id: 'novo',
    title: 'Novo',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    filter: (lead) => lead.status === 'Novo',
    acceptsStatus: ['Novo'],
  },
  {
    id: 'em-atendimento',
    title: 'Em Atendimento',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    filter: (lead) => lead.status === 'Em Atendimento',
    acceptsStatus: ['Em Atendimento'],
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    filter: (lead) => lead.status === 'Ganho' || lead.status === 'Perdido',
    acceptsStatus: ['Ganho', 'Perdido'],
  },
];

export function KanbanBoard({ leads, onUpdate }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [orcamentoModalOpen, setOrcamentoModalOpen] = useState(false);
  const [pendingDragLead, setPendingDragLead] = useState<Lead | null>(null);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, column: KanbanColumn) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedLead) return;

    // Determine new status based on column
    let newStatus: LeadStatus;
    if (column.id === 'novo') {
      newStatus = 'Novo';
    } else if (column.id === 'em-atendimento') {
      // If dragging from Novo to Em Atendimento, open modal to insert value
      if (draggedLead.status === 'Novo') {
        setPendingDragLead(draggedLead);
        setOrcamentoModalOpen(true);
        setDraggedLead(null);
        return;
      }
      newStatus = 'Em Atendimento';
    } else {
      // For finalizado, keep current status if already finalized, otherwise don't allow drop
      if (draggedLead.status === 'Ganho' || draggedLead.status === 'Perdido') {
        newStatus = draggedLead.status;
      } else {
        toast.error('Use os botões para marcar como Ganho ou Perdido');
        setDraggedLead(null);
        return;
      }
    }

    if (draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', draggedLead.id);

    if (error) {
      toast.error('Erro ao mover lead');
    } else {
      toast.success(`Lead movido para ${newStatus}`);
      onUpdate();
    }

    setDraggedLead(null);
  };

  const handleOrcamentoConfirm = async (valor: number) => {
    if (!pendingDragLead) return;

    const { error } = await supabase
      .from('leads')
      .update({ valor_fechamento: valor, status: 'Em Atendimento' as LeadStatus })
      .eq('id', pendingDragLead.id);

    if (error) {
      toast.error('Erro ao enviar orçamento');
      return;
    }
    toast.success('Orçamento enviado! Lead movido para Em Atendimento');
    setPendingDragLead(null);
    onUpdate();
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          let columnLeads = leads.filter(column.filter);
          
          // Ordenar leads "Em Atendimento" por ultimo_contato (mais antigos primeiro)
          if (column.id === 'em-atendimento') {
            columnLeads = [...columnLeads].sort((a, b) => {
              // Leads sem ultimo_contato vão primeiro (nunca contatados)
              if (!a.ultimo_contato && !b.ultimo_contato) return 0;
              if (!a.ultimo_contato) return -1;
              if (!b.ultimo_contato) return 1;
              // Ordenar por data mais antiga primeiro
              return new Date(a.ultimo_contato).getTime() - new Date(b.ultimo_contato).getTime();
            });
          }
          
          const ganhos = columnLeads.filter(l => l.status === 'Ganho').length;
          const perdidos = columnLeads.filter(l => l.status === 'Perdido').length;
          const isDragOver = dragOverColumn === column.id;

          return (
            <div 
              key={column.id} 
              className="flex flex-col"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
            >
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
              <div className={cn(
                'flex-1 bg-muted/30 rounded-b-lg border border-t-0 p-2 min-h-[400px] space-y-2 overflow-y-auto max-h-[600px] transition-colors',
                isDragOver && 'bg-accent/30 border-accent'
              )}>
                {columnLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                    {isDragOver ? 'Solte aqui' : 'Nenhum lead'}
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <KanbanCard 
                      key={lead.id} 
                      lead={lead} 
                      onUpdate={onUpdate}
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onLeadClick={() => handleLeadClick(lead)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailModal
        lead={selectedLead}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onUpdate={onUpdate}
      />

      <OrcamentoModal
        open={orcamentoModalOpen}
        onOpenChange={(open) => {
          setOrcamentoModalOpen(open);
          if (!open) setPendingDragLead(null);
        }}
        onConfirm={handleOrcamentoConfirm}
        title="Enviar Orçamento"
        currentValue={pendingDragLead?.valor_fechamento}
      />
    </>
  );
}
