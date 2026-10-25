import { useEffect, useRef, type ReactNode } from 'react';

/** Modal on the native <dialog> (focus trap, Escape, backdrop): open while mounted with `open`. */
export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onClose={onClose} onCancel={onClose}>
      <h2 id="dialog-title" className="dialog__title">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
