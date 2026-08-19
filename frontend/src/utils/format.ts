export function formatHours(hours: number | null | undefined): string | null {
  if (hours === null || hours === undefined || hours <= 0) {
    return null;
  }

  const rounded = Math.round(hours * 10) / 10;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return `~${text}h para zerar`;
}