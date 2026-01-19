import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type DateFilter = 'all' | 'today' | 'week' | 'month' | '7days' | '30days';

interface DateFilterToggleProps {
  value: DateFilter;
  onChange: (value: DateFilter) => void;
}

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mês' },
  { value: 'all', label: 'Todos' },
];

export function DateFilterToggle({ value, onChange }: DateFilterToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={(v) => v && onChange(v as DateFilter)}
      className="justify-start flex-wrap"
    >
      {filterOptions.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className="h-10 px-4 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
