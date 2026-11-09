import { Icon, type IconName } from '@/shared/ui';
import styles from './ProductImage.module.css';

export type ProductImageProps = {
  /** The image URL from the backend. Empty or missing ⇒ a neutral placeholder. */
  src?: string;
  alt: string;
  className?: string;
  /** The icon of the placeholder (defaults to a cake). */
  fallbackIcon?: IconName;
};

/**
 * Ảnh sản phẩm với ô đại diện trung tính khi máy chủ không có ảnh.
 *
 * Trước đây màn hình dùng ảnh mẫu trong `public/images` khi thiếu ảnh — người
 * dùng thấy một tấm ảnh không liên quan và tưởng đó là sản phẩm thật. Ở môi
 * trường prod, thiếu ảnh phải hiện ra đúng là thiếu ảnh.
 */
export function ProductImage({ src, alt, className, fallbackIcon = 'cake' }: ProductImageProps) {
  if (!src) {
    return (
      <span className={`${styles.placeholder} ${className ?? ''}`} role="img" aria-label={alt}>
        <Icon name={fallbackIcon} size={24} />
      </span>
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />;
}
