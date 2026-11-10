import { useEffect, useState } from 'react';
import { DOCUMENT_LABELS, vendorCatalogApi, type VendorDocumentKind } from '@/entities/vendor';
import { formatDateTime } from '@/shared/utils';
import styles from './reviewApplicationsUi.module.css';

interface VendorDocumentLinksProps {
  vendorId: string;
  documents: Array<{ id: string; kind: string; uploadedAt?: string }>;
}

/** Nhãn của một loại giấy tờ; loại lạ (ví dụ hoá đơn phí) hiện nguyên tên. */
function labelOf(kind: string): string {
  return DOCUMENT_LABELS[kind as VendorDocumentKind] ?? kind;
}

/**
 * Giấy tờ hiện hành của hồ sơ, mỗi cái có link xem (AC-27.6).
 *
 * Link do máy chủ ký và chỉ sống ít phút, nên lấy khi hiện danh sách chứ
 * không lưu lại.
 */
export function VendorDocumentLinks({ vendorId, documents }: VendorDocumentLinksProps) {
  const [links, setLinks] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      documents.map(async (doc) => {
        try {
          return [doc.id, await vendorCatalogApi.getDocumentLink(vendorId, doc.id)] as const;
        } catch {
          return [doc.id, null] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) setLinks(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [vendorId, documents]);

  if (documents.length === 0) {
    return <p className={styles.documentNote}>Hồ sơ chưa có giấy tờ nào.</p>;
  }

  return (
    <ul className={styles.documentList}>
      {documents.map((doc) => {
        const url = links[doc.id];
        return (
          <li key={doc.id} className={styles.documentItem}>
            <span>
              <strong>{labelOf(doc.kind)}</strong>
              {doc.uploadedAt && (
                <span className={styles.documentNote}> · {formatDateTime(doc.uploadedAt)}</span>
              )}
            </span>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer">
                Xem tệp
              </a>
            ) : (
              <span className={styles.documentNote}>
                {doc.id in links ? 'Không lấy được link' : 'Đang lấy link…'}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
