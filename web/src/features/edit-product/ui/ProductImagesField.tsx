import { Icon } from '@/shared/ui';
import styles from './editProductUi.module.css';

/** The backend accepts 1 to 10 images per product (ProductConstant.MAX_IMAGES). */
export const MAX_PRODUCT_IMAGES = 10;

interface ProductImagesFieldProps {
  /** Temp keys of new uploads and keys of stored images, in order. */
  images: Array<{ key: string; url?: string }>;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: (key: string) => void;
}

/** FR-29: ảnh sản phẩm, tải thẳng lên kho lưu trữ; ít nhất một ảnh. */
export function ProductImagesField({ images, uploading, onUpload, onRemove }: ProductImagesFieldProps) {
  const full = images.length >= MAX_PRODUCT_IMAGES;
  return (
    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor="product-image">
        Ảnh sản phẩm * (1 đến {MAX_PRODUCT_IMAGES} ảnh)
      </label>
      <input
        id="product-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading || full}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
      <span className={styles.imageHint}>
        {uploading ? 'Đang tải ảnh lên…' : 'Ảnh được tải thẳng lên kho lưu trữ, không đi qua máy chủ API.'}
      </span>
      {images.length > 0 && (
        <div className={styles.imageList}>
          {images.map((image, index) => (
            <span key={image.key} className={styles.imageItem}>
              {image.url ? (
                <img src={image.url} alt={`Ảnh ${index + 1}`} className={styles.imageThumb} />
              ) : (
                <span>Ảnh mới {index + 1}</span>
              )}
              <button
                type="button"
                className={styles.imageRemove}
                aria-label={`Bỏ ảnh ${index + 1}`}
                onClick={() => onRemove(image.key)}
              >
                <Icon name="x" size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
