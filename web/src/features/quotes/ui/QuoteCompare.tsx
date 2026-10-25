import { useState } from 'react';
import { KeyValue, PageHeader, StatusBadge } from '../../../shared/ui';
import { formatRating, formatVnd } from '../../../shared/utils/money';
import { closeRequest } from '../api/quotesApi';
import type { QuoteRequest } from '../api/types';
import { bestOf, deposit, perBox, requestStatusLabel } from '../model/quoteModel';

/**
 * M6.2.1: the request and its quotes side by side (DS QuoteCompare). Money stays with Moonkage until accepted:
 * the box under the table says so before anyone presses "Chấp nhận".
 */
export function QuoteCompare({
  request,
  onAccept,
  onChanged,
}: {
  request: QuoteRequest;
  onAccept: (supplierId: string) => void;
  onChanged: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const open = request.status === 'waiting' || request.status === 'new-quotes';
  const pending = request.invited.filter((i) => !request.quotes.some((q) => q.supplierId === i.supplierId));
  const best = request.quotes.length > 1 ? bestOf(request.quotes) : null;
  const status = requestStatusLabel[request.status];

  const close = async () => {
    setClosing(true);
    await closeRequest(request.id);
    onChanged();
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow={request.kind === 'open' ? 'Gửi nhiều nơi' : `Gửi riêng ${request.directTo}`}
        title={
          <>
            Yêu cầu {request.id} <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </>
        }
        lead={`${request.boxes} hộp × ${request.perBox} · ${request.custom.toLowerCase()} · giao ${request.deliverTo} trước ${request.deliverBy}`}
      />
      <p className="muted">
        Đã mời {request.invited.length} đơn vị{pending.length ? ` · ${pending.length} chưa trả lời` : ''}
      </p>

      {request.quotes.length === 0 ? (
        <p className="notice">Chưa có báo giá. Bạn nhận thông báo khi đơn vị gửi báo giá.</p>
      ) : (
        <div className="table-scroll">
          <table className="mk-quotes">
            <thead>
              <tr>
                <td />
                {request.quotes.map((q) => (
                  <th key={q.supplierId} scope="col">
                    <div className="quote-head">
                      {q.supplierName}
                      {open && (
                        <button type="button" className="mk-btn mk-btn--primary mk-btn--sm" onClick={() => onAccept(q.supplierId)}>
                          Chấp nhận
                        </button>
                      )}
                      {request.acceptedSupplierId === q.supplierId && <StatusBadge tone="ok">Đã chấp nhận</StatusBadge>}
                    </div>
                  </th>
                ))}
                {pending.map((p) => (
                  <th key={p.supplierId} scope="col" className="mk-expired">
                    {p.supplierName}
                    <br />
                    <span className="muted">Chưa gửi báo giá</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="mk-total">
                <th scope="row">Tổng giá</th>
                {request.quotes.map((q) => (
                  <td key={q.supplierId} className={best && q.total === best.total ? 'mk-best' : undefined}>
                    {formatVnd(q.total)}
                    <br />
                    <span className="muted">{formatVnd(perBox(q))}/hộp</span>
                  </td>
                ))}
                {pending.map((p) => (
                  <td key={p.supplierId} className="mk-expired">—</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Đặt cọc</th>
                {request.quotes.map((q) => (
                  <td key={q.supplierId}>
                    {q.depositPercent}% · {formatVnd(deposit(q))}
                  </td>
                ))}
                {pending.map((p) => (
                  <td key={p.supplierId} />
                ))}
              </tr>
              <tr>
                <th scope="row">Giao trước</th>
                {request.quotes.map((q) => (
                  <td key={q.supplierId} className={best && q.deliverBy === best.deliverBy ? 'mk-best' : undefined}>
                    {q.deliverBy}
                  </td>
                ))}
                {pending.map((p) => (
                  <td key={p.supplierId} />
                ))}
              </tr>
              <tr>
                <th scope="row">Làm riêng</th>
                {request.quotes.map((q) => (
                  <td key={q.supplierId}>{q.custom}</td>
                ))}
                {pending.map((p) => (
                  <td key={p.supplierId} />
                ))}
              </tr>
              <tr>
                <th scope="row">Đơn vị</th>
                {request.quotes.map((q) => (
                  <td key={q.supplierId}>
                    {formatRating(q.rating)} ★ · {q.customOrders} đơn đặt hàng
                  </td>
                ))}
                {pending.map((p) => (
                  <td key={p.supplierId} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="grid-2">
        {open && request.quotes.length > 0 && (
          <section className="panel panel--wide" aria-labelledby="money-before">
            <h2 id="money-before" className="card-title-text">
              Trước khi chấp nhận
            </h2>
            <p className="notice">Bước này chưa trả tiền.</p>
            <ul className="cond-list">
              <li>Khi chấp nhận: trả tiền cọc qua VNPay. Moonkage giữ tiền cọc và chỉ chuyển cho đơn vị từng phần khi quản trị duyệt giải ngân.</li>
              <li>Phần còn lại trả sau khi đơn vị giao hàng.</li>
              <li>Chấp nhận một báo giá là thỏa thuận ràng buộc; các báo giá khác của yêu cầu này sẽ tự đóng.</li>
            </ul>
          </section>
        )}
        <section className="panel panel--wide" aria-labelledby="sent-req">
          <h2 id="sent-req" className="card-title-text">
            Yêu cầu bạn đã gửi
          </h2>
          <KeyValue
            rows={[
              { label: 'Số hộp', value: `${request.boxes} hộp × ${request.perBox}` },
              { label: 'Vỏ / nhân', value: `${request.crusts.join(', ')} · ${request.fillings.join(', ').toLowerCase()}` },
              { label: 'Làm riêng', value: request.custom },
              { label: 'Giao', value: `${request.deliverTo} · trước ${request.deliverBy}` },
            ]}
          />
          {open && (
            <button type="button" className="mk-btn mk-btn--quiet mk-btn--sm" onClick={close} aria-busy={closing || undefined}>
              Đóng yêu cầu
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
