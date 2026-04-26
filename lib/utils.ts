export function formatNumber(n: number, decimals?: number): string {
  if (n >= 1000000)
    return `${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(n / 1000000)}M`;
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 1,
  }).format(n);
}
export function formatNumberBig(n: number, decimals?: number): string {
  if (n >= 1000000)
    return `${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(n / 1000000)}M`;

  if (n >= 1000)
    return `${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(n / 1000)}K`;

  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 1,
  }).format(n);
}
export function formatDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function safenumber(v: any): number {
  return v ?? 0;
}

export function calcPercentageSave(oldVal: number, newVal: number): number {
  if (!oldVal || oldVal === 0) return 0;
  return ((oldVal - newVal) / oldVal) * 100;
}
