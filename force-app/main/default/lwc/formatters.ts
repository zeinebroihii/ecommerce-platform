/** Shared formatting utilities used across dashboard widgets */

export function formatMoney(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M€';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + ' K€';
  return v.toLocaleString('fr-FR') + ' €';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}
