/** Ghép các className hợp lệ (bỏ qua false, null, undefined, chuỗi rỗng). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
