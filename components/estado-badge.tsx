import { cn } from '@/lib/utils';
import { ESTADO_DIAN_META } from '@/lib/constants';
import type { EstadoDian } from '@/lib/types';

interface Props {
  estado: EstadoDian;
  className?: string;
  withDot?: boolean;
}

export function EstadoDianBadge({ estado, className, withDot = true }: Props) {
  const meta = ESTADO_DIAN_META[estado];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        meta.tone,
        className
      )}
    >
      {withDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      )}
      {meta.label}
    </span>
  );
}
