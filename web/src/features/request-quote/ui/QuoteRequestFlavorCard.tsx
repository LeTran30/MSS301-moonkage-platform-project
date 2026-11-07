import { Card, Select } from '@/shared/ui';
import { useTaxonomy, useTaxonomyCatalog } from '@/entities/product';
import styles from './QuoteRequestCards.module.css';

interface QuoteRequestFlavorCardProps {
  crustPreference: string;
  onCrustPreferenceChange: (value: string) => void;
  fillingPreference: string;
  onFillingPreferenceChange: (value: string) => void;
}

/** Label of the empty choice: the buyer leaves the flavour to the Shop. */
const NO_PREFERENCE = 'Không yêu cầu riêng';

/**
 * Step 4 of the quote request form: the flavours the buyer prefers.
 *
 * The buyer picks from the crust and filling catalogue the Shops also tag their cakes with (FR-54), so a Shop
 * reads the same names it sells; each field stays optional.
 */
export function QuoteRequestFlavorCard({
  crustPreference,
  onCrustPreferenceChange,
  fillingPreference,
  onFillingPreferenceChange,
}: QuoteRequestFlavorCardProps) {
  useTaxonomyCatalog();
  const { crusts, fillings } = useTaxonomy();
  // The first option clears the choice: a buyer who picked a crust can go back to having no preference.
  const toOptions = (items: { name: string; isActive: boolean }[]) => [
    { value: '', label: NO_PREFERENCE },
    ...items.filter((it) => it.isActive).map((it) => ({ value: it.name, label: it.name })),
  ];

  return (
    <Card padding="lg" className={styles.card}>
      <h3 className={styles.cardTitle}>4. Hương vị bánh mong muốn</h3>

      <div className={styles.grid2}>
        <Select
          label="Vỏ bánh ưu tiên"
          options={toOptions(crusts)}
          value={crustPreference}
          onChange={onCrustPreferenceChange}
          placeholder={NO_PREFERENCE}
        />
        <Select
          label="Vị nhân ưu tiên"
          options={toOptions(fillings)}
          value={fillingPreference}
          onChange={onFillingPreferenceChange}
          placeholder={NO_PREFERENCE}
        />
      </div>
    </Card>
  );
}
