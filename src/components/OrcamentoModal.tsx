import { useState, useEffect } from 'react';
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
  const [valor, setValor] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Update value when modal opens with currentValue
  useEffect(() => {
    if (open && currentValue) {
      setValor(currentValue.toString());
    } else if (!open) {
      setValor('');
    }
  }, [open, currentValue]);

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
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="valor" className="text-base font-medium">
              Valor do Orçamento (R$)
            </Label>
            <Input
              id="valor"
              type="text"
              placeholder="Digite o valor aqui (ex: 1500,00)"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoFocus
              required
              className="h-14 text-lg text-center font-semibold"
            />
            <p className="text-sm text-muted-foreground text-center">
              Exemplo: 1500,00 ou 2500.50
            </p>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 text-base"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !valor}
              className="h-12 px-8 text-base font-semibold"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
              ✓ Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
