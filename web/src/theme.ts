/** The DS themes are switched by `data-theme` on <html>: follow the OS setting ("Giấy dó" light, "Đêm rằm" dark). */
export function followSystemTheme() {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => document.documentElement.setAttribute('data-theme', query.matches ? 'dark' : 'light');
  apply();
  query.addEventListener('change', apply);
}
