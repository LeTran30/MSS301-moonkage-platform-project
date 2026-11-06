import { Select, Textarea } from '@/shared/ui';

interface ProductDeliveryDescriptionProps {
  deliveryLabel: 'LOCAL' | 'NATIONWIDE';
  description: string;
  onDeliveryLabelChange: (value: 'LOCAL' | 'NATIONWIDE') => void;
  onDescriptionChange: (value: string) => void;
}

/** Phương thức giao nhận + mô tả hương vị, nguyên liệu & chứng nhận VSATTP. */
export function ProductDeliveryDescription({
  deliveryLabel,
  description,
  onDeliveryLabelChange,
  onDescriptionChange,
}: ProductDeliveryDescriptionProps) {
  return (
    <>
      <div>
        <Select
          id="product-delivery"
          label="Phương thức giao nhận"
          options={[
            { value: 'NATIONWIDE', label: 'Giao toàn quốc' },
            { value: 'LOCAL', label: 'Chỉ giao nội thành (Bánh tươi/Bánh lạnh)' },
          ]}
          value={deliveryLabel}
          onChange={(v) => onDeliveryLabelChange(v as 'LOCAL' | 'NATIONWIDE')}
        />
      </div>

      <div>
        <Textarea
          id="product-desc"
          label="Mô tả hương vị, nguyên liệu & chứng nhận VSATTP"
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Ghi rõ xuất xứ nguyên liệu, hạn sử dụng, hướng dẫn bảo quản..."
        />
      </div>
    </>
  );
}
