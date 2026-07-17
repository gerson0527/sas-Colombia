export function formatCOP(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '$ 0';
  return '$ ' + new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function formatShortDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function daysUntil(iso: string | undefined | null): number | null {
  if (!iso) return null;
  try {
    const target = new Date(iso).getTime();
    const now = Date.now();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export function truncateMiddle(value: string | undefined, length = 16): string {
  if (!value) return '—';
  if (value.length <= length) return value;
  const head = value.slice(0, Math.floor(length / 2) - 1);
  const tail = value.slice(-Math.floor(length / 2));
  return `${head}…${tail}`;
}
