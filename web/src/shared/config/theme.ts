/**
 * The web runs in light mode only: `data-theme="light"` is fixed on <html> whatever the OS setting.
 * (tokens.css still carries the design system's dark values; nothing switches to them.)
 */
export function applyLightTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.style.colorScheme = 'light';
}

/**
 * Đọc giá trị token trực tiếp từ CSS variables trên :root (`tokens.css` là nguồn duy nhất).
 */
export function getToken(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
