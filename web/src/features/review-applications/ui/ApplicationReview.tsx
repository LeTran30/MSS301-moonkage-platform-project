import { useState } from 'react';
import { applicationLabel, ownerMatch, type ApplicationState, type VendorApplication } from '@/entities/vendor';
import { KeyValue, PageHeader, SectionTabs, StatusBadge } from '@/shared/ui';
import { decideApplication } from '../api/decideApplicationApi';
import styles from './ApplicationReview.module.css';

/** Q2.1: the owner check, the documents, and the decision (approve, ask for more, refuse, lock). */
export function ApplicationReview({ app, onChanged }: { app: VendorApplication; onChanged: () => void }) {
  const [tab, setTab] = useState<'profile' | 'history'>('profile');
  const [checked, setChecked] = useState(false);
  const [more, setMore] = useState('');
  const [refuse, setRefuse] = useState('');
  const m = ownerMatch(app);
  const label = applicationLabel[app.state];
  const decide = async (state: ApplicationState, note?: string) => {
    await decideApplication(app.id, state, note);
    onChanged();
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow={`Hồ sơ người bán · lần nộp ${app.attempt}`}
        title={
          <>
            {app.shopName} <StatusBadge tone={label.tone}>{label.label}</StatusBadge>
          </>
        }
        lead={`${app.kind} · ${app.city} · nộp ${app.submittedAt}`}
      />
      <div className={styles.detailLayout}>
        <SectionTabs
          current={tab}
          onChange={setTab}
          tabs={[
            { key: 'profile', label: 'Hồ sơ' },
            { key: 'history', label: `Lịch sử ${app.history.length}` },
          ]}
        >
          {tab === 'profile' ? (
            <div className="stack">
              <h2 className="detail-heading">So khớp chủ hộ (tự động)</h2>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col">Trên giấy đăng ký</th>
                    <th scope="col">Từ chip CCCD</th>
                    <th scope="col">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Họ tên</th>
                    <td>{app.ownerOnPaper.name}</td>
                    <td>{app.ownerOnChip.name}</td>
                    <td>
                      <StatusBadge tone={m.name ? 'ok' : 'warn'}>{m.name ? 'Khớp' : 'Lệch'}</StatusBadge>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Số định danh</th>
                    <td className="mk-num">{app.ownerOnPaper.id}</td>
                    <td className="mk-num">{app.ownerOnChip.id}</td>
                    <td>
                      <StatusBadge tone={m.id ? 'ok' : 'warn'}>{m.id ? 'Khớp' : 'Lệch'}</StatusBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="grid-2">
                {['Giấy đăng ký kinh doanh', 'Giấy an toàn thực phẩm'].map((d) => (
                  <div key={d} className={styles.docTile}>
                    <div className={styles.mockupFrame}>{d}</div>
                    <button type="button" className="mk-btn mk-btn--text">
                      Xem tệp gốc
                    </button>
                  </div>
                ))}
              </div>
              <KeyValue
                rows={[
                  { label: 'Mã đăng ký', value: app.regNo },
                  { label: 'Địa chỉ', value: app.address },
                  { label: 'Nguồn hàng', value: app.source },
                  { label: 'Cách bán', value: app.ways },
                ]}
              />
            </div>
          ) : (
            <KeyValue rows={app.history.map((h) => ({ label: h.at, value: h.label }))} />
          )}
        </SectionTabs>
        <aside className={styles.actionBox} aria-labelledby="decide-heading">
          <h2 id="decide-heading" className="card-title-text">
            Quyết định
          </h2>
          {app.state === 'pending' ? (
            <>
              <label className="check">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> Tôi đã đối chiếu giấy tờ gốc với thông tin khai
              </label>
              <button type="button" className="mk-btn mk-btn--primary mk-btn--block" disabled={!checked} onClick={() => decide('approved')}>
                Duyệt
              </button>
              <div className="mk-field">
                <label htmlFor="more">Yêu cầu bổ sung</label>
                <textarea id="more" className={styles.textarea} rows={2} value={more} onChange={(e) => setMore(e.target.value)} placeholder="Ảnh giấy đăng ký rõ hơn, thấy đủ 4 góc." />
              </div>
              <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" disabled={!more.trim()} onClick={() => decide('needs-more', more.trim())}>
                Gửi yêu cầu bổ sung
              </button>
              <div className="mk-field">
                <label htmlFor="refuse">Từ chối</label>
                <textarea id="refuse" className={styles.textarea} rows={2} value={refuse} onChange={(e) => setRefuse(e.target.value)} placeholder="Lý do người bán sẽ đọc" />
              </div>
              <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" disabled={!refuse.trim()} onClick={() => decide('rejected', refuse.trim())}>
                Từ chối hồ sơ
              </button>
            </>
          ) : (
            <>
              <p>Hồ sơ đang ở trạng thái: {label.label.toLowerCase()}.</p>
              {app.state === 'approved' && (
                <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" onClick={() => decide('locked', 'Khóa bởi quản trị')}>
                  Khóa người bán
                </button>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

