const vnd = new Intl.NumberFormat('vi-VN');

/** 245000 → "245.000đ" */
export function formatCurrency(value: number): string {
  return `${vnd.format(Math.round(value))}đ`;
}

export function formatNumber(value: number): string {
  return vnd.format(value);
}

/** ISO → "25/10/2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** ISO → "14:05 · 25/10/2026" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mi} · ${formatDate(iso)}`;
}

/** Thời gian tương đối ngắn: "5 phút trước" */
export function formatRelative(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return formatDate(iso);
}

/** Che bớt chuỗi nhạy cảm: "079203001234" → "0792••••1234" */
export function maskMiddle(value: string, keepStart = 4, keepEnd = 4): string {
  if (value.length <= keepStart + keepEnd) return value;
  return `${value.slice(0, keepStart)}${'•'.repeat(value.length - keepStart - keepEnd)}${value.slice(-keepEnd)}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Sinh ID tạm thời có cấu trúc và khả năng truy vết cao (thay cho Math.random / Date.now)
 */
export function generateEntityId(prefix: string, separator = '_'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}${separator}${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}${separator}${Math.random().toString(36).slice(2, 10)}`;
}

