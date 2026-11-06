import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style = {},
}: SkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'circle':
        return styles.variantCircle;
      case 'rect':
        return styles.variantRect;
      case 'card':
        return styles.variantCard;
      case 'text':
      default:
        return styles.variantText;
    }
  };

  const parsedWidth = typeof width === 'number' ? `${width}px` : width;
  const parsedHeight = typeof height === 'number' ? `${height}px` : height;

  // The size is a runtime value, so it travels as a CSS custom property instead
  // of an inline `style` attribute.
  const itemStyle = {
    ...style,
    '--skeleton-width': parsedWidth,
    '--skeleton-height': parsedHeight,
  } as React.CSSProperties;

  if (count > 1) {
    return (
      <div className={`${className} ${styles.stack}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <span
            key={idx}
            className={`${styles.skeleton} ${getVariantClass()}`}
            style={itemStyle}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={`${styles.skeleton} ${getVariantClass()} ${className}`}
      style={itemStyle}
      aria-hidden="true"
    />
  );
}
