import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  icon: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  hint?: string;
}

const toneMap: Record<NonNullable<Props['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

export function KpiCard({ label, value, delta, icon: Icon, tone = 'primary', hint }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            toneMap[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
              delta.positive
                ? 'bg-success/15 text-success'
                : 'bg-destructive/15 text-destructive'
            )}
          >
            {delta.positive ? '↑' : '↓'} {delta.value}
          </span>
          <span className="text-muted-foreground">vs. mes anterior</span>
        </div>
      )}
    </Card>
  );
}
