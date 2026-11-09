/**
 * Brings the first field marked invalid into view and focuses it, once React has drawn the errors.
 *
 * A form checked on submit shows its errors next to the fields, often above the submit button the user is looking at;
 * without this they press the button and see nothing happen. `Input` marks a field with an error `aria-invalid`.
 */
export function focusFirstInvalidField(form: HTMLFormElement | null): void {
  if (!form) return;
  requestAnimationFrame(() => {
    const field = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!field) return;
    // Giữa màn hình, để header dính phía trên không che mất ô lỗi.
    field.scrollIntoView?.({ block: 'center' });
    field.focus({ preventScroll: true });
  });
}
