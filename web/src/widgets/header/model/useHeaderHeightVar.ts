import { useLayoutEffect, useRef } from 'react';

/** CSS variable the sticky sidebars and panels sit under. */
const HEADER_HEIGHT_VAR = '--header-h';

/**
 * Keeps `--header-h` equal to the header's real height.
 *
 * The header's height depends on what it shows (the dev top bar, a wrapped row on a narrow screen), so a fixed
 * token left sticky elements partly hidden under it. Without ResizeObserver the token in tokens.css stays.
 */
export function useHeaderHeightVar<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const apply = () => root.style.setProperty(HEADER_HEIGHT_VAR, `${el.offsetHeight}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(HEADER_HEIGHT_VAR);
    };
  }, []);
  return ref;
}
