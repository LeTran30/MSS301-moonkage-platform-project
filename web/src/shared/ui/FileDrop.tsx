import { useId, useState } from 'react';

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
    <div className="file-drop">
      <span className="file-drop__label">{label}</span>
      <label htmlFor={id} className="file-drop__zone">
        <span>
          Kéo tệp vào đây hoặc <u>chọn tệp</u>
        </span>
        {hint && <span className="muted">{hint}</span>}
        {names.length > 0 && <span className="file-drop__names">{names.join(', ')}</span>}
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
