import { useId, useState } from 'react';
import styles from './FileDrop.module.css';

/** File picker as a drop zone; shows the chosen file names (nothing is uploaded until the form is sent). */
export function FileDrop({
  label,
  hint,
  accept,
  multiple,
  onSelect,
}: {
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  onSelect?: (files: File[]) => void;
}) {
  const id = useId();
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className={styles.fileDrop}>
      <span className={styles.label}>{label}</span>
      <label htmlFor={id} className={styles.zone}>
        <span>
          Kéo tệp vào đây hoặc <u>chọn tệp</u>
        </span>
        {hint && <span className="muted">{hint}</span>}
        {names.length > 0 && <span className={styles.names}>{names.join(', ')}</span>}
      </label>
      <input
        id={id}
        type="file"
        className="mk-sr"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          setNames(files.map((f) => f.name));
          onSelect?.(files);
        }}
      />
    </div>
  );
}
