import { useMemo } from 'react';
import { encode } from 'uqr';
import { cn } from '@/shared/lib';
import styles from './QrCode.module.css';

/** Quiet zone the QR spec asks for, in modules; scanners lose the code without it. */
const QUIET_ZONE_MODULES = 4;

type Props = {
  /** Text the code carries. */
  value: string;
  /** Rendered width and height in px. */
  size?: number;
  /** What a screen reader says instead of the picture. */
  label: string;
  className?: string;
};

/**
 * A QR code drawn as one SVG path, so it stays sharp at any size and takes its
 * colours from the design tokens. Dark on light in both themes: phone scanners
 * miss an inverted code.
 */
export function QrCode({ value, size = 200, label, className }: Props) {
  const { path, modules } = useMemo(() => {
    const qr = encode(value, { border: QUIET_ZONE_MODULES });
    let d = '';
    qr.data.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) d += `M${x} ${y}h1v1h-1z`;
      });
    });
    return { path: d, modules: qr.size };
  }, [value]);

  return (
    <svg
      className={cn(styles.qr, className)}
      width={size}
      height={size}
      viewBox={`0 0 ${modules} ${modules}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <rect className={styles.quiet} width={modules} height={modules} />
      <path className={styles.module} d={path} />
    </svg>
  );
}
