/** VND as the design system shows it: `680.000đ` (dot thousands, no space, no decimals). */
export function formatVnd(amount: number): string {
  const rounded = Math.round(amount);
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${rounded < 0 ? '-' : ''}${digits}đ`;
}

/** Ratings as the design system shows them: `4,8` (comma decimal, one digit). */
export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}
