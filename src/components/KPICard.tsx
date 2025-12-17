import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, icon: Icon, trend, className }: KPICardProps) {
  return (
    <Card className={cn('overflow-hidden animate-fade-in', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.positive ? 'text-status-ganho' : 'text-status-perdido'
              )}>
                {trend.positive ? '+' : ''}{trend.value}% vs mês anterior
              </p>
            )}
          </div>
          <div className="p-2.5 rounded-lg bg-accent/10">
            <Icon className="w-5 h-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
