import { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function LeadDetailModal({ lead, open, onOpenChange, onUpdate }: LeadDetailModalProps) {
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [demanda, setDemanda] = useState('');
  const [status, setStatus] = useState<LeadStatus>('Novo');
  const [valorFechamento, setValorFechamento] = useState('');
  const [motivoPerda, setMotivoPerda] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setNome(lead.nome);
      setContato(lead.contato);
      setDemanda(lead.demanda || '');
      setStatus(lead.status);
      setValorFechamento(lead.valor_fechamento?.toString() || '');
      setMotivoPerda(lead.motivo_perda || '');
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead) return;

    setSaving(true);
    const { error } = await supabase
      .from('leads')
      .update({
        nome,
        contato,
        demanda: demanda || null,
        status,
        valor_fechamento: valorFechamento ? parseFloat(valorFechamento) : null,
        motivo_perda: status === 'Perdido' ? motivoPerda : null,
      })
      .eq('id', lead.id);

    setSaving(false);

    if (error) {
      toast.error('Erro ao salvar lead');
      return;
    }

    toast.success('Lead atualizado com sucesso!');
    onUpdate();
    onOpenChange(false);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do lead"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contato">Contato</Label>
            <Input
              id="contato"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              placeholder="Telefone ou email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="demanda">Demanda</Label>
            <Textarea
              id="demanda"
              value={demanda}
              onChange={(e) => setDemanda(e.target.value)}
              placeholder="Descreva a demanda do cliente..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as LeadStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Novo">Novo</SelectItem>
                <SelectItem value="Em Atendimento">Em Atendimento</SelectItem>
                <SelectItem value="Ganho">Ganho</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              value={valorFechamento}
              onChange={(e) => setValorFechamento(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {status === 'Perdido' && (
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Perda</Label>
              <Input
                id="motivo"
                value={motivoPerda}
                onChange={(e) => setMotivoPerda(e.target.value)}
                placeholder="Ex: Preço alto, concorrência..."
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
