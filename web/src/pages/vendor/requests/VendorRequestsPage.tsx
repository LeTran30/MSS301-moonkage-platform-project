import { useState } from 'react';
import { Badge, Button, Card, Tabs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { formatCurrency, formatDate } from '@/shared/utils';
import { type Quote, type QuoteRequest, useVendorRequestList } from '@/entities/request';
import { useCurrentUser } from '@/entities/user';
import { useMyVendorId } from '@/entities/vendor';
import { SubmitQuoteModal } from '@/features/respond-to-quote-request';
import { useWithdrawQuote } from '@/features/withdraw-quote';
import { useDeclineInvitation } from '@/features/decline-invitation';
import styles from './VendorRequestsPage.module.css';

type RequestTab = 'OPEN' | 'DIRECT' | 'ALL';

export function VendorRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestTab>('OPEN');
  const [selectedReq, setSelectedReq] = useState<QuoteRequest | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  // FR-36: the requests sent to the caller's vendor. The backend filters them
  // by the vendor of the token.
  const user = useCurrentUser();
  const myVendorId = useMyVendorId();
  const vendorId = user.vendorId || (myVendorId.kind === 'loaded' ? myVendorId.data ?? '' : '');
  const asyncRequests = useVendorRequestList(vendorId);
  const requests = asyncRequests.kind === 'loaded' ? asyncRequests.data : [];

  const { busy, run } = useAction();
  const withdrawQuote = useWithdrawQuote();
  const declineInvitation = useDeclineInvitation();

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'OPEN') return req.type === 'OPEN';
    if (activeTab === 'DIRECT') return req.type === 'DIRECT';
    return true;
  });

  const handleOpenQuoteModal = (req: QuoteRequest) => {
    setSelectedReq(req);
    setQuoteModalOpen(true);
  };

  const handleSubmitQuote = (_quote: Quote) => {
    asyncRequests.reload();
  };

  /** BR-05: the only change to a sent quote is taking it back. */
  const handleWithdrawQuote = (req: QuoteRequest) => {
    const quote = req.quotes[0];
    if (!quote) return;
    void run(async () => {
      await withdrawQuote(req.id, quote.id);
      toast.success(`Đã rút báo giá #${quote.id} của yêu cầu #${req.id}.`);
      asyncRequests.reload();
    });
  };

  /** AC-36.3: the only answer a vendor may give an invitation is declining it. */
  const handleDeclineInvitation = (req: QuoteRequest) => {
    if (!vendorId) return;
    void run(async () => {
      await declineInvitation(req.id, vendorId, {
        status: 'DECLINED',
        declineReason: 'Xưởng không đủ năng lực đáp ứng số lượng và thời hạn này.',
      });
      toast.success(`Đã từ chối lời mời của yêu cầu #${req.id}.`);
      asyncRequests.reload();
    });
  };

  if (asyncRequests.kind === 'loading') {
    return <p role="status">Đang tải yêu cầu báo giá…</p>;
  }
  if (asyncRequests.kind === 'error') {
    return (
      <div role="alert">
        <p>{asyncRequests.message}</p>
        <Button variant="secondary" onClick={asyncRequests.reload}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý yêu cầu báo giá (B3.0 - B3.2)</h1>
          <p className={styles.desc}>
            Tiếp cận khách hàng doanh nghiệp đặt bánh số lượng lớn. Soạn báo giá cạnh tranh, linh hoạt tỷ lệ cọc và ngày giao.
          </p>
        </div>
        <div className={styles.badgeHint}>
          ⚡ Cơ hội doanh số:{' '}
          <strong>{requests.reduce((sum, r) => sum + r.quantity, 0).toLocaleString()} hộp bánh</strong>
        </div>
      </div>

      <Tabs<RequestTab>
        items={[
          { id: 'OPEN', label: 'Yêu cầu mở toàn sàn (Flow 2)' },
          { id: 'DIRECT', label: 'Yêu cầu chỉ định riêng (Flow 3)' },
          { id: 'ALL', label: 'Tất cả yêu cầu' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {filteredRequests.length === 0 ? (
        <p className={styles.desc}>Chưa có yêu cầu nào phù hợp.</p>
      ) : (
        <div className={styles.list}>
          {filteredRequests.map((req) => {
            const quoteTotal = req.quotes.length || req.quoteCount || 0;
            const hasQuoted = req.quotes.length > 0;

            return (
              <Card key={req.id} className={styles.reqCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.reqMeta}>
                    <span className={styles.reqId}>#{req.id}</span>
                    <Badge tone={req.type === 'DIRECT' ? 'gold' : 'neutral'}>
                      {req.type === 'DIRECT' ? 'Chỉ định riêng cho xưởng' : 'Đăng công khai toàn sàn'}
                    </Badge>
                    <span className={styles.reqDate}>Hạn nhận hàng: {formatDate(req.deliveryDeadline)}</span>
                  </div>
                  {hasQuoted && <Badge tone="green">✓ Xưởng đã gửi báo giá</Badge>}
                </div>

                <div className={styles.reqBody}>
                  <div className={styles.reqMain}>
                    <h3 className={styles.reqTitle}>Đơn hàng {req.quantity} hộp quà doanh nghiệp</h3>
                    <div className={styles.specsGrid}>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Số lượng cần:</span>
                        <strong className={styles.specVal}>{req.quantity.toLocaleString()} hộp</strong>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Ngân sách dự kiến:</span>
                        <strong className={styles.specVal}>
                          {req.budgetPerBox ? `${formatCurrency(req.budgetPerBox)} / hộp` : 'Thương lượng'}
                        </strong>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Ưa thích vỏ/nhân:</span>
                        <strong className={styles.specVal}>{req.crustPreference || 'Truyền thống'}</strong>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Giao tại:</span>
                        <strong className={styles.specVal}>
                          {req.deliveryAddress} ({req.deliveryProvince})
                        </strong>
                      </div>
                    </div>

                    {req.customLogoFileName && (
                      <div className={styles.customLogoTag}>
                        🏷️ Khách yêu cầu: Đã đính kèm logo {req.customLogoFileName}
                      </div>
                    )}

                    <p className={styles.reqNotes}>
                      <strong>Yêu cầu đặc biệt:</strong> {req.customRequirements || 'Theo mẫu chuẩn của xưởng'}
                    </p>
                  </div>

                  <div className={styles.reqSidebar}>
                    <div className={styles.buyerBox}>
                      <span className={styles.buyerLabel}>Khách hàng:</span>
                      <strong className={styles.buyerName}>{req.buyerName}</strong>
                      <span className={styles.nfcVerifiedTag}>🛡️ Đã xác thực NFC CCCD</span>
                    </div>

                    <div className={styles.responsesCount}>
                      Đã có <strong>{quoteTotal} xưởng</strong> gửi báo giá
                    </div>

                    <Button
                      variant={hasQuoted ? 'secondary' : 'primary'}
                      size="md"
                      onClick={() => handleOpenQuoteModal(req)}
                    >
                      {hasQuoted ? 'Cập nhật lại báo giá' : '📝 Soạn báo giá ngay'}
                    </Button>

                    {/* BR-05: rút báo giá đã gửi. AC-36.3: từ chối lời mời. */}
                    <div className={styles.requestActions}>
                      {hasQuoted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={busy}
                          onClick={() => handleWithdrawQuote(req)}
                        >
                          Rút báo giá
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busy}
                        onClick={() => handleDeclineInvitation(req)}
                      >
                        Từ chối lời mời
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Soạn báo giá qua Feature (B3.1, B3.2) */}
      <SubmitQuoteModal
        isOpen={quoteModalOpen}
        request={selectedReq}
        onClose={() => setQuoteModalOpen(false)}
        onSubmit={handleSubmitQuote}
      />
    </div>
  );
}
