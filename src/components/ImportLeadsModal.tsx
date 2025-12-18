import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Profile, LeadStatus } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedores: Profile[];
  onSuccess: () => void;
}

interface ParsedLead {
  nome: string;
  contato: string;
  status?: string;
  valid: boolean;
  error?: string;
}

export function ImportLeadsModal({ open, onOpenChange, vendedores, onSuccess }: ImportLeadsModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const resetState = () => {
    setParsedLeads([]);
    setSelectedVendedor('');
    setFileName('');
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const parseCSV = (content: string): ParsedLead[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim());
    const nomeIndex = header.findIndex(h => h === 'nome' || h === 'name');
    const contatoIndex = header.findIndex(h => h === 'contato' || h === 'telefone' || h === 'phone' || h === 'email');
    const statusIndex = header.findIndex(h => h === 'status');

    if (nomeIndex === -1 || contatoIndex === -1) {
      toast.error('CSV deve conter colunas "nome" e "contato"');
      return [];
    }

    const validStatuses: LeadStatus[] = ['Novo', 'Em Atendimento', 'Ganho', 'Perdido'];

    return lines.slice(1).map(line => {
      const values = line.split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const nome = values[nomeIndex] || '';
      const contato = values[contatoIndex] || '';
      const status = statusIndex !== -1 ? values[statusIndex] : undefined;

      let valid = true;
      let error: string | undefined;

      if (!nome) {
        valid = false;
        error = 'Nome obrigatório';
      } else if (!contato) {
        valid = false;
        error = 'Contato obrigatório';
      } else if (status && !validStatuses.includes(status as LeadStatus)) {
        valid = false;
        error = 'Status inválido';
      }

      return { nome, contato, status, valid, error };
    }).filter(lead => lead.nome || lead.contato);
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setParsedLeads(parsed);
      if (parsed.length === 0) {
        toast.error('Nenhum lead válido encontrado no arquivo');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!selectedVendedor) {
      toast.error('Selecione um vendedor responsável');
      return;
    }

    const validLeads = parsedLeads.filter(l => l.valid);
    if (validLeads.length === 0) {
      toast.error('Nenhum lead válido para importar');
      return;
    }

    setImporting(true);

    const leadsToInsert = validLeads.map(lead => ({
      nome: lead.nome.trim(),
      contato: lead.contato.trim(),
      status: (lead.status as LeadStatus) || 'Novo',
      vendedor_id: selectedVendedor,
    }));

    const { error } = await supabase.from('leads').insert(leadsToInsert);

    setImporting(false);

    if (error) {
      toast.error('Erro ao importar leads');
      return;
    }

    toast.success(`${validLeads.length} lead${validLeads.length > 1 ? 's' : ''} importado${validLeads.length > 1 ? 's' : ''} com sucesso!`);
    handleClose(false);
    onSuccess();
  };

  const validCount = parsedLeads.filter(l => l.valid).length;
  const invalidCount = parsedLeads.filter(l => !l.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Leads via CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-4">
          {/* Drop Zone */}
          {parsedLeads.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-foreground font-medium mb-1">
                Arraste seu arquivo CSV aqui
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Formato esperado: nome, contato (status opcional)
              </p>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          ) : (
            <>
              {/* File Info & Stats */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">{fileName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  Trocar arquivo
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-status-ganho">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{validCount} válido{validCount !== 1 ? 's' : ''}</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-1.5 text-status-perdido">
                    <AlertCircle className="w-4 h-4" />
                    <span>{invalidCount} com erro{invalidCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Vendedor Selection */}
              <div className="space-y-2">
                <Label>Vendedor Responsável</Label>
                <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o vendedor para atribuir os leads" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.full_name || v.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Validação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedLeads.slice(0, 50).map((lead, index) => (
                        <TableRow key={index} className={cn(!lead.valid && 'bg-destructive/5')}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{lead.nome || '-'}</TableCell>
                          <TableCell>{lead.contato || '-'}</TableCell>
                          <TableCell>{lead.status || 'Novo'}</TableCell>
                          <TableCell>
                            {lead.valid ? (
                              <CheckCircle2 className="w-4 h-4 text-status-ganho" />
                            ) : (
                              <span className="text-xs text-status-perdido">{lead.error}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedLeads.length > 50 && (
                  <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                    Mostrando 50 de {parsedLeads.length} leads
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          {parsedLeads.length > 0 && (
            <Button 
              onClick={handleImport} 
              disabled={importing || validCount === 0 || !selectedVendedor}
            >
              {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Importar {validCount} Lead{validCount !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
