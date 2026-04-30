export function formatRub(amount: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatNumber(amount: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonthShort(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return months[parseInt(m, 10) - 1] || yyyymm;
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || '??';
}

export function segmentColor(segment: 'LOW' | 'MEDIUM' | 'HIGH'): { bg: string; fg: string } {
  switch (segment) {
    case 'LOW':    return { bg: 'rgba(66,139,249,0.15)', fg: '#428BF9' };
    case 'MEDIUM': return { bg: 'rgba(255,221,45,0.18)', fg: '#8a6500' };
    case 'HIGH':   return { bg: 'rgba(115,92,221,0.15)', fg: '#735CDD' };
  }
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  if (currency === 'rub') return formatRub(amount, 0);
  if (currency === 'miles') return `${formatNumber(amount)} миль`;
  if (currency === 'bravo-points') return `${formatNumber(amount)} баллов`;
  return formatNumber(amount);
}

export function programGradient(programName: string): string {
  const n = programName.toLowerCase();
  if (n.includes('black')) return 'linear-gradient(135deg, #2C2D31 0%, #1C1C1E 100%)';
  if (n.includes('airlines')) return 'linear-gradient(135deg, #428BF9 0%, #735CDD 100%)';
  if (n.includes('bravo')) return 'linear-gradient(135deg, #FF8A65 0%, #F5564E 100%)';
  return '#1C1C1E';
}
