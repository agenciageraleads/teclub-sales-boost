import { useState, useEffect, useRef } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trash2, Upload, FileText, ExternalLink } from 'lucide-react';

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
  const [origem, setOrigem] = useState('');
  const [status, setStatus] = useState<LeadStatus>('Novo');
  const [valorFechamento, setValorFechamento] = useState('');
  const [motivoPerda, setMotivoPerda] = useState('');
  const [orcamentoUrl, setOrcamentoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lead) {
      setNome(lead.nome);
      setContato(lead.contato);
      setDemanda(lead.demanda || '');
      setOrigem(lead.origem || 'Manual');
      setStatus(lead.status);
      setValorFechamento(lead.valor_fechamento?.toString() || '');
      setMotivoPerda(lead.motivo_perda || '');
      setOrcamentoUrl(lead.orcamento_url || null);
    }
  }, [lead]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lead) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${lead.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('orcamentos')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Erro ao fazer upload do arquivo');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('orcamentos')
      .getPublicUrl(fileName);

    // Update lead with the file URL
    const { error: updateError } = await supabase
      .from('leads')
      .update({ orcamento_url: fileName })
      .eq('id', lead.id);

    setUploading(false);

    if (updateError) {
      toast.error('Erro ao salvar referência do arquivo');
      return;
    }

    setOrcamentoUrl(fileName);
    toast.success('Orçamento anexado com sucesso!');
    onUpdate();
  };

  const getOrcamentoDownloadUrl = async () => {
    if (!orcamentoUrl) return null;
    const { data } = await supabase.storage
      .from('orcamentos')
      .createSignedUrl(orcamentoUrl, 3600);
    return data?.signedUrl;
  };

  const handleViewOrcamento = async () => {
    const url = await getOrcamentoDownloadUrl();
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Erro ao obter link do arquivo');
    }
  };

  const handleSave = async () => {
    if (!lead) return;

    setSaving(true);
    const { error } = await supabase
      .from('leads')
      .update({
        nome,
        contato,
        demanda: demanda || null,
        origem: origem || 'Manual',
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

  const handleDelete = async () => {
    if (!lead) return;

    setDeleting(true);
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', lead.id);

    setDeleting(false);

    if (error) {
      toast.error('Erro ao excluir lead');
      return;
    }

    toast.success('Lead excluído com sucesso!');
    onUpdate();
    onOpenChange(false);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="origem">Origem</Label>
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="n8n">n8n</SelectItem>
                <SelectItem value="CSV">Importação CSV</SelectItem>
                <SelectItem value="Site">Site</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Indicação">Indicação</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="Orçamento Enviado">Orçamento Enviado</SelectItem>
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

          {/* Anexar Orçamento */}
          <div className="space-y-2">
            <Label>Orçamento Anexado</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
              />
              {orcamentoUrl ? (
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleViewOrcamento}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Ver Orçamento
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Substituir'}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Anexar PDF ou Imagem
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PDF, JPG, PNG, WebP (máx. 10MB)
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O lead {lead.nome} será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}