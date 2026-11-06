import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { useAction } from '@/shared/lib';
import { Tabs, toast, AsyncState, EmptyState } from '@/shared/ui';
import { useOrderList, type Order } from '@/entities/order';
import { VendorOrderCard } from '@/entities/order';
import { useMyVendorId } from '@/entities/vendor';
import {
  AttachInvoiceModal,
  UploadMaketModal,
  useAttachInvoice,
  useUploadMockup,
} from '@/features/fulfill-order';
import { uploadFile } from '@/shared/api';
import styles from './VendorOrdersPage.module.css';

type VendorOrderTab = 'ALL' | 'RETAIL' | 'BULK' | 'DISPUTED';

/**
 * B2.0 - B2.2 — the orders of the Shop.
 *
 * `GET /api/orders?vendorId=...` lists them (FR-30); the vendor attaches the
 * invoice (`PUT /api/orders/{orderId}/invoice`, FR-44) and sends a new maket
 * version (`POST /api/orders/{orderId}/mockups`, FR-39).
 */
export function VendorOrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<VendorOrderTab>('ALL');
  const { busy, run } = useAction();

  // FR-27: `GET /api/vendors?ownerAccountId=me` gives the Shop's own id.
  const asyncVendorId = useMyVendorId();
  const vendorId = asyncVendorId.kind === 'loaded' ? asyncVendorId.data : undefined;

  const asyncOrders = useOrderList({ vendorId });

  const attachInvoice = useAttachInvoice();
  const uploadMockup = useUploadMockup();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [maketModalOpen, setMaketModalOpen] = useState(false);
  const [maketFile, setMaketFile] = useState<File | null>(null);
  const [maketNote, setMaketNote] = useState('');

  const orders = asyncOrders.kind === 'loaded' ? asyncOrders.data : [];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'RETAIL') return o.type === 'RETAIL';
    if (activeTab === 'BULK') return o.type === 'BULK';
    if (activeTab === 'DISPUTED') return o.hasDispute === true;
    return true;
  });

  const waitingMaket = orders.filter((o) => o.status === 'WAITING_MAKET').length;
  const disputed = orders.filter((o) => o.hasDispute === true).length;

  const handleAttachInvoice = (order: Order) => {
    setSelectedOrder(order);
    setInvoiceNumber('');
    setInvoiceFile(null);
    setInvoiceModalOpen(true);
  };

  /** FR-44: upload the invoice, then attach its `tempKey` to the order. */
  const handleSaveInvoice = () => {
    if (!selectedOrder) return;
    void run(async () => {
      if (!invoiceFile) {
        toast.error('Vui lòng chọn tệp hóa đơn điện tử.');
        return;
      }
      const tempKey = await uploadFile('ORDER', invoiceFile);
      if (!tempKey) {
        toast.info('Chế độ demo: bỏ qua bước tải tệp lên.');
        setInvoiceModalOpen(false);
        return;
      }
      const link = await attachInvoice(selectedOrder.id, tempKey);
      toast.success(
        link?.downloadUrl
          ? `Đã gắn hóa đơn VAT thành công cho đơn #${selectedOrder.id}`
          : `Đã ghi nhận hóa đơn cho đơn #${selectedOrder.id}`
      );
      setInvoiceModalOpen(false);
      asyncOrders.reload();
    });
  };

  const handleUploadMaket = (order: Order) => {
    setSelectedOrder(order);
    setMaketFile(null);
    setMaketNote('');
    setMaketModalOpen(true);
  };

  /** FR-39: upload the maket, then send it as a new version of the order. */
  const handleSaveMaket = () => {
    if (!selectedOrder) return;
    void run(async () => {
      if (!maketFile) {
        toast.error('Vui lòng chọn tệp thiết kế Maket.');
        return;
      }
      const tempKey = await uploadFile('ORDER', maketFile);
      if (!tempKey) {
        toast.info('Chế độ demo: bỏ qua bước tải tệp lên.');
        setMaketModalOpen(false);
        return;
      }
      const version = await uploadMockup(selectedOrder.id, tempKey);
      toast.success(`Đã gửi Maket phiên bản v${version.version} cho khách hàng duyệt!`);
      setMaketModalOpen(false);
      asyncOrders.reload();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý đơn hàng (B2.0 - B2.2)</h1>
          <p className={styles.desc}>
            Xử lý đơn bán sẵn, theo dõi đơn sản xuất theo yêu cầu, gắn hóa đơn VAT và tải lên Maket
            thiết kế.
          </p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statBadge}>
            <span>Cần gửi Maket:</span> <strong>{waitingMaket} đơn</strong>
          </div>
          <div className={styles.statBadge}>
            <span>Đang khiếu nại:</span> <strong className={styles.errorText}>{disputed} đơn</strong>
          </div>
        </div>
      </div>

      <Tabs<VendorOrderTab>
        items={[
          { id: 'ALL', label: `Tất cả đơn (${orders.length})` },
          { id: 'RETAIL', label: 'Đơn bán lẻ / Shop sẵn' },
          { id: 'BULK', label: 'Đơn đặt hàng doanh nghiệp' },
          { id: 'DISPUTED', label: 'Đang khiếu nại (FR-49)' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      <AsyncState
        state={asyncOrders}
        onRetry={asyncOrders.reload}
        loadingMessage="Đang tải đơn hàng của gian hàng..."
        isEmpty={() => filteredOrders.length === 0}
        empty={
          <EmptyState
            icon="package"
            title="Chưa có đơn hàng nào"
            description="Các đơn hàng mua lẻ và đơn đặt số lượng lớn từ doanh nghiệp sẽ hiển thị tại đây."
          />
        }
      >
        {() => (
          <div className={styles.orderList}>
            {filteredOrders.map((order) => (
              <VendorOrderCard
                key={order.id}
                order={order}
                onUploadMaket={handleUploadMaket}
                onAttachInvoice={handleAttachInvoice}
                onOpen={(o) => navigate(routes.vendor.order(o.id))}
              />
            ))}
          </div>
        )}
      </AsyncState>

      {/* Modal Attach Invoice (B2.2, FR-44) */}
      <AttachInvoiceModal
        open={invoiceModalOpen}
        invoiceNumber={invoiceNumber}
        invoiceFile={invoiceFile}
        busy={busy}
        onInvoiceNumberChange={setInvoiceNumber}
        onInvoiceFileChange={setInvoiceFile}
        onClose={() => setInvoiceModalOpen(false)}
        onSubmit={handleSaveInvoice}
      />

      {/* Modal Maket (B2.1, Flow 2, FR-39) */}
      <UploadMaketModal
        open={maketModalOpen}
        maketFile={maketFile}
        maketNote={maketNote}
        busy={busy}
        onMaketFileChange={setMaketFile}
        onMaketNoteChange={setMaketNote}
        onClose={() => setMaketModalOpen(false)}
        onSubmit={handleSaveMaket}
      />
    </div>
  );
}
