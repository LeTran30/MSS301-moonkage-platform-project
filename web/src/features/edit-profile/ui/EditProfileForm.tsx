import { useState, type FormEvent } from 'react';
import { useCurrentUser } from '@/entities/user';
import { useAction } from '@/shared/lib';
import { Button, Input, toast } from '@/shared/ui';
import { MAX_FULL_NAME_LENGTH, updateFullName } from '../api/editProfileApi';
import styles from './EditProfileForm.module.css';

/** FR-02: the person changes the name they show inside the platform. */
export function EditProfileForm() {
  const user = useCurrentUser();
  const [name, setName] = useState(user.name);
  const { busy, error, setError, run } = useAction();
  const trimmed = name.trim();
  const unchanged = trimmed === user.name;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!trimmed) {
      setError('Nhập họ và tên.');
      return;
    }
    const ok = await run(() => updateFullName(trimmed));
    if (ok) toast.success('Đã cập nhật họ và tên.');
  }

  return (
    <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
      <Input
        label="Họ và tên hiển thị"
        value={name}
        maxLength={MAX_FULL_NAME_LENGTH}
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
      />
      <Button type="submit" variant="primary" size="sm" loading={busy} disabled={unchanged || !trimmed}>
        Lưu
      </Button>
    </form>
  );
}
