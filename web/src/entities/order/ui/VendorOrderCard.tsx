import { formatCurrency, formatDate } from '@/shared/utils';
import { Badge, Button, Card } from '@/shared/ui';
import type { Order } from '../model/types';
import styles from './VendorOrderCard.module.css';

interface VendorOrderCardProps {
  order: Order;
  /** Tải lên bản thiết kế maket (FR-39) — chỉ đơn đặt hàng số lượng lớn. */
  onUploadMaket: (order: Order) => void;
  /** Gắn hoặc sửa hóa đơn VAT (FR-44). */
  onAttachInvoice: (order: Order) => void;
}

/** Thẻ đơn hàng trong danh sách của gian hàng (B2.0 - B2.2). */
export function VendorOrderCard({
  order,
  onUploadMaket,
  onAttachInvoice,
}: VendorOrderCardProps) {
  return (
    <Card className={styles.orderCard}>
      <div className={styles.cardTop}>
        <div className={styles.orderMeta}>
          <span className={styles.orderId}>#{order.id}</span>
          <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
          <Badge tone={order.type === 'BULK' ? 'gold' : 'neutral'}>
            {order.type === 'BULK' ? 'Đơn đặt hàng sản xuất' : 'Đơn bán lẻ shop'}
          </Badge>
        </div>

        <div className={styles.orderStatusBadge}>
          {order.hasDispute ? (
            <Badge tone="red">Đang có khiếu nại (Tạm khóa tiền)</Badge>
          ) : order.status === 'WAITING_MAKET' ? (
            <Badge tone="gold">Chờ khách duyệt Maket</Badge>
          ) : order.status === 'IN_PRODUCTION' ? (
            <Badge tone="blue">Đang tiến hành sản xuất</Badge>
          ) : (
            <Badge tone="green">Đã thanh toán / Hoàn tất</Badge>
          )}
        </div>
      </div>

      <div className={styles.orderBody}>
        <div className={styles.buyerInfo}>
          <p>
            <strong>Người mua:</strong> {order.buyerName} ({order.shippingAddress.receiver})
          </p>
          <p>
            <strong>Địa chỉ nhận:</strong> {order.shippingAddress.address},{' '}
            {order.shippingAddress.province}
          </p>
          {order.invoiceCompanyInfo && (
            <p className={styles.invoiceTag}>
              Có yêu cầu xuất hóa đơn VAT: <strong>{order.invoiceCompanyInfo.name}</strong> (MST:{' '}
              {order.invoiceCompanyInfo.taxCode})
            </p>
          )}
        </div>

        <div className={styles.itemsSummary}>
          {order.items.map((item, idx) => (
            <div key={idx} className={styles.itemRow}>
              <span>
                {item.name} (x{item.quantity})
              </span>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span>Tổng giá trị đơn:</span>
            <span className={styles.totalAmount}>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardActions}>
        <div className={styles.actionNotes}>
          {order.type === 'BULK' && (
            <span>
              Cọc đã nhận: <strong>{formatCurrency(order.depositAmount || 0)}</strong>
            </span>
          )}
        </div>

        <div className={styles.btnGroup}>
          {order.type === 'BULK' && (
            <Button variant="secondary" size="sm" onClick={() => onUploadMaket(order)}>
              Tải lên Maket
            </Button>
          )}

          <Button
            variant={order.hasInvoice ? 'ghost' : 'primary'}
            size="sm"
            onClick={() => onAttachInvoice(order)}
          >
            {order.hasInvoice ? 'Sửa hóa đơn VAT' : 'Gắn hóa đơn VAT'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
