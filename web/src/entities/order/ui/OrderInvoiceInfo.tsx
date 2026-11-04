import { Button, Card } from '@/shared/ui';
import type { Order } from '../model/types';
import styles from './OrderInvoiceInfo.module.css';

interface OrderInvoiceInfoProps {
  order: Order;
  busy: boolean;
  /** Tải file hóa đơn điện tử của xưởng (FR-25). */
  onDownload: () => void;
}

/** Thông tin hóa đơn GTGT doanh nghiệp của đơn hàng. */
export function OrderInvoiceInfo({ order, busy, onDownload }: OrderInvoiceInfoProps) {
  const info = order.invoiceCompanyInfo;
  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.cardTitle}>Hóa đơn GTGT Doanh nghiệp</h3>
      {info ? (
        <div className={styles.invoiceInfoBox}>
          <div>
            <strong>Tên đơn vị:</strong> {info.name}
          </div>
          <div>
            <strong>Mã số thuế:</strong> {info.taxCode}
          </div>
          <div>
            <strong>Địa chỉ:</strong> {info.address}
          </div>
          <div>
            <strong>Email nhận hóa đơn:</strong> {info.email}
          </div>
          <div className={styles.invoiceDownloadBtn}>
            <Button
              variant="secondary"
              size="sm"
              iconLeft="download"
              loading={busy}
              onClick={onDownload}
            >
              Tải file hóa đơn điện tử
            </Button>
          </div>
        </div>
      ) : (
        <p>Đơn hàng này không đăng ký xuất hóa đơn doanh nghiệp khi thanh toán.</p>
      )}
    </Card>
  );
}
