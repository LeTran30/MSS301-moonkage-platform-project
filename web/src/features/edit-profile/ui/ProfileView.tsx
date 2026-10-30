import { useState } from 'react';
import { useSession } from '@/entities/user';
import { KeyValue, StatusBadge } from '@/shared/ui';

/** M6.5: the account (editable name) and the verified identity (read-only, from the CCCD chip). */
export function ProfileView({ identity }: { identity: { name: string; idMasked: string; verifiedAt: string } | null }) {
  const { session, updateDisplayName } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session?.displayName ?? '');
  if (!session) return null;
  return (
    <div className="stack">
      <section className="panel panel--wide" aria-labelledby="acc-heading">
        <div className="row-between">
          <h2 id="acc-heading" className="detail-heading">
            Tài khoản
          </h2>
          {!editing && (
            <button type="button" className="mk-btn mk-btn--quiet mk-btn--sm" onClick={() => setEditing(true)}>
              Sửa
            </button>
          )}
        </div>
        {editing ? (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) updateDisplayName?.(name.trim());
              setEditing(false);
            }}
          >
            <div className="mk-field">
              <label htmlFor="display-name">Tên hiển thị</label>
              <input id="display-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <button type="submit" className="mk-btn mk-btn--primary mk-btn--sm">
              Lưu
            </button>
          </form>
        ) : (
          <KeyValue
            rows={[
              { label: 'Tên hiển thị', value: name || session.displayName },
              { label: 'Email', value: session.email || session.accountId },
              { label: 'Mật khẩu', value: '••••••••' },
            ]}
          />
        )}
      </section>
      <section className="panel panel--wide" aria-labelledby="id-heading">
        <div className="row-between">
          <h2 id="id-heading" className="detail-heading">
            Danh tính đã xác minh
          </h2>
          <StatusBadge tone="muted">Chỉ xem</StatusBadge>
        </div>
        {identity ? (
          <>
            <KeyValue
              rows={[
                { label: 'Họ tên', value: identity.name },
                { label: 'Số định danh', value: <span className="mk-num">{identity.idMasked}</span> },
                { label: 'Trạng thái', value: `Đã xác minh ${identity.verifiedAt}` },
              ]}
            />
            <p className="muted">Lấy từ chip CCCD, không sửa được.</p>
          </>
        ) : (
          <p className="muted">Chưa xác minh danh tính. Xác minh ở mục Xác minh danh tính.</p>
        )}
      </section>
    </div>
  );
}
