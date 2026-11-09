import { ChatInbox } from '@/features/chat';
import { Breadcrumbs } from '@/shared/ui';
import { routes } from '@/shared/config';
import styles from './VendorMessagesPage.module.css';

/** What buyers asked the Shop, before or after they bought. */
export function VendorMessagesPage() {
  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh người bán', to: routes.vendor.overview },
          { label: 'Tin nhắn khách hàng' },
        ]}
      />
      <h1 className={styles.title}>Tin nhắn khách hàng</h1>
      <ChatInbox as="VENDOR" />
    </div>
  );
}
