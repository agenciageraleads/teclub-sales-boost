import { useState } from 'react';
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
import { Loader2, DollarSign } from 'lucide-react';

interface OrcamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (valor: number) => Promise<void>;
  title?: string;
  currentValue?: number | null;
}

export function OrcamentoModal({
  open,
  onOpenChange,
  onConfirm,
  title = 'Enviar Orçamento',
  currentValue,
}: OrcamentoModalProps) {
  const [valor, setValor] = useState<string>(currentValue?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) return;

    setLoading(true);
    await onConfirm(valorNum);
    setLoading(false);
    setValor('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor do Orçamento (R$)</Label>
            <Input
              id="valor"
              type="text"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !valor}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
