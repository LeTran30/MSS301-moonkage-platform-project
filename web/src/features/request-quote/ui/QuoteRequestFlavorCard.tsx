import { Card, Input } from '@/shared/ui';
import styles from './QuoteRequestCards.module.css';

interface QuoteRequestFlavorCardProps {
  crustPreference: string;
  onCrustPreferenceChange: (value: string) => void;
  fillingPreference: string;
  onFillingPreferenceChange: (value: string) => void;
}

/** Step 4 of the quote request form: the flavours the buyer prefers. */
export function QuoteRequestFlavorCard({
  crustPreference,
  onCrustPreferenceChange,
  fillingPreference,
  onFillingPreferenceChange,
}: QuoteRequestFlavorCardProps) {
  return (
    <Card padding="lg" className={styles.card}>
      <h3 className={styles.cardTitle}>4. Hương vị bánh mong muốn</h3>

      <div className={styles.grid2}>
        <Input
          label="Vỏ bánh ưu tiên"
          value={crustPreference}
          onChange={(e) => onCrustPreferenceChange(e.target.value)}
          placeholder="VD: Bánh nướng truyền thống, bánh dẻo hoa bưởi..."
        />
        <Input
          label="Vị nhân ưu tiên"
          value={fillingPreference}
          onChange={(e) => onFillingPreferenceChange(e.target.value)}
          placeholder="VD: Thập cẩm gà quay, Đậu xanh hạt sen..."
        />
      </div>
    </Card>
  );
}
