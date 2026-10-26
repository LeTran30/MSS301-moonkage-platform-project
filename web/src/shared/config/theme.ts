/**
 * The web runs in light mode only: `data-theme="light"` is fixed on <html> whatever the OS setting.
 * (tokens.css still carries the design system's dark values; nothing switches to them.)
 */
export function applyLightTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.style.colorScheme = 'light';
}
