/** Chỉ đọc giá trị từ CSS variables, không định nghĩa lại (package-architecture §6). */
export function getToken(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
