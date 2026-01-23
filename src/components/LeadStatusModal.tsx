import { useState } from 'react';
import { Lead, LeadStatus } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LeadStatusModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const statusOptions: LeadStatus[] = ['Novo', 'Em Atendimento', 'Orçamento Enviado', 'Ganho', 'Perdido'];

export function LeadStatusModal({ lead, open, onOpenChange, onSuccess }: LeadStatusModalProps) {
  const [status, setStatus] = useState<LeadStatus>(lead?.status || 'Novo');
  const [valorFechamento, setValorFechamento] = useState(lead?.valor_fechamento?.toString() || '');
  const [motivoPerda, setMotivoPerda] = useState(lead?.motivo_perda || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead) return;

    if ((status === 'Ganho' || status === 'Orçamento Enviado') && !valorFechamento) {
      toast.error('Valor do fechamento/orçamento é obrigatório');
      return;
    }

    if (status === 'Perdido' && !motivoPerda.trim()) {
      toast.error('Motivo da perda é obrigatório para leads perdidos');
      return;
    }

    setLoading(true);

    const updateData: Partial<Lead> = {
      status,
      valor_fechamento: (status === 'Ganho' || status === 'Orçamento Enviado') ? parseFloat(valorFechamento) : lead.valor_fechamento,
      motivo_perda: status === 'Perdido' ? motivoPerda.trim() : null,
    };

    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', lead.id);

    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar lead');
      return;
    }

    toast.success('Lead atualizado com sucesso!');
    onSuccess();
    onOpenChange(false);
  };

  // Reset form when lead changes
  if (lead && status !== lead.status && !loading) {
    setStatus(lead.status);
    setValorFechamento(lead.valor_fechamento?.toString() || '');
    setMotivoPerda(lead.motivo_perda || '');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Atualizar Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Lead</Label>
            <p className="text-foreground font-semibold">{lead?.nome}</p>
            <p className="text-sm text-muted-foreground">{lead?.contato}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(status === 'Ganho' || status === 'Orçamento Enviado') && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="valor">
                {status === 'Orçamento Enviado' ? 'Valor do Orçamento *' : 'Valor do Fechamento *'}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorFechamento}
                  onChange={(e) => setValorFechamento(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
          )}

          {status === 'Perdido' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="motivo">Motivo da Perda *</Label>
              <Textarea
                id="motivo"
                value={motivoPerda}
                onChange={(e) => setMotivoPerda(e.target.value)}
                placeholder="Descreva o motivo..."
                rows={3}
                required
              />
            </div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
