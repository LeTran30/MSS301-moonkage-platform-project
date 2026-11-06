import styles from './AdminInterprovinceFeePage.module.css';
import { useState, type FormEvent } from 'react';
import { routes } from '@/shared/config';
import { Button, ButtonLink, Card, Breadcrumbs, toast, AsyncState } from '@/shared/ui';
import { useAction, useAsync } from '@/shared/lib';
import {
  interprovinceFeeApi,
  type InterprovinceFeeTable,
} from '@/entities/interprovince-fee';
import { replaceFeeTable } from '@/features/configure-interprovince-fees';

/**
 * Q6.1 — the interprovincial shipping fee table (FR-52, AC-52.1, AC-52.3).
 *
 * The table belongs to catalog-service: `GET /api/interprovince-fees` reads it
 * and `PUT /api/interprovince-fees` replaces it. The backend refuses a table
 * that misses a province (`INCOMPLETE_FEE_TABLE`), so the form always sends
 * one row per province of the national list.
 */
export function AdminInterprovinceFeePage() {
  const { busy, run } = useAction();
  const asyncTable = useAsyncFeeTable();

  // Người dùng sửa từng dòng; bảng đã lưu được nạp lại vào state khi tải xong.
  const [rows, setRows] = useState<Record<string, number>>({});
  const [loadedTable, setLoadedTable] = useState<InterprovinceFeeTable | null>(null);

  // Điều chỉnh state khi dữ liệu tải xong: bảng mới thay bảng cũ trong ô nhập.
  if (asyncTable.kind === 'loaded' && asyncTable.data !== loadedTable) {
    setLoadedTable(asyncTable.data);
    const next: Record<string, number> = {};
    for (const row of asyncTable.data.fees) {
      next[row.provinceCode] = row.fee ?? 0;
    }
    setRows(next);
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      const fees = Object.entries(rows).map(([provinceCode, fee]) => ({
        provinceCode,
        fee: Number.isFinite(fee) && fee >= 0 ? fee : 0,
      }));
      await replaceFeeTable(fees);
      toast.success('Đã lưu biểu phí vận chuyển liên tỉnh toàn sàn!');
      asyncTable.reload();
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Cấu hình hệ thống', to: routes.admin.config },
          { label: 'Biểu phí liên tỉnh' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Biểu Phí Vận Chuyển Liên Tỉnh & Xe Lạnh (Q6.1)
          </h1>
          <p className={styles.subtitle}>
            Quy định mức trần cước phí vận chuyển bánh Trung Thu bảo quản đặc biệt giữa các tỉnh thành
          </p>
        </div>
      </div>

      <AsyncState state={asyncTable} onRetry={asyncTable.reload}>
        {(table: InterprovinceFeeTable) => (
          <Card padding="lg" className={styles.form}>
            <form onSubmit={handleSave} className={styles.stack} noValidate>
              {!table.complete && (
                <p role="status" className={styles.warning}>
                  Biểu phí chưa được cấu hình đủ cho mọi tỉnh. Máy chủ sẽ từ chối lưu cho tới khi
                  bảng đủ 34 tỉnh.
                </p>
              )}

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <caption className={styles.caption}>
                    Cước phí liên tỉnh (VNĐ / đơn) theo tỉnh nhận
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Mã tỉnh</th>
                      <th scope="col">Tỉnh / Thành phố</th>
                      <th scope="col">Cước phí (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.fees.map((row) => (
                      <tr key={row.provinceCode}>
                        <td>{row.provinceCode}</td>
                        <td>{row.provinceName}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={rows[row.provinceCode] ?? 0}
                            onChange={(e) =>
                              setRows((prev) => ({
                                ...prev,
                                [row.provinceCode]: Number(e.target.value),
                              }))
                            }
                            className={styles.input}
                            aria-label={`Cước phí liên tỉnh ${row.provinceName}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.actions}>
                <Button type="submit" variant="primary" loading={busy}>
                  Lưu Biểu Phí Toàn Sàn
                </Button>
                <ButtonLink to={routes.admin.config} variant="outline">
                  Quay Lại
                </ButtonLink>
              </div>
            </form>
          </Card>
        )}
      </AsyncState>
    </div>
  );
}

/** Load the fee table; `useAsync` is imported here to keep the JSX readable. */
function useAsyncFeeTable() {
  return useAsync<InterprovinceFeeTable>(() => interprovinceFeeApi.getTable(), []);
}
