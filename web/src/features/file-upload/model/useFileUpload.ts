import { useCallback, useEffect, useRef, useState } from 'react';

import { uploadFile as uploadFileApi, type UploadPhase, type UploadTarget } from '../api/uploadFile';

/**
 * The state of one file upload (progress, error, abort).
 *
 * Vì sao có hook: tải tệp lên là hành động có vòng đời — đang xin link, đang
 * gửi bytes, xong hoặc lỗi — và phải huỷ được. Nếu để mỗi page tự quản lý
 * thì luật "một lần tải, một nguồn sự thật" bị phá: mỗi page sẽ có một bản
 * riêng của cùng một đoạn logic, và chỗ nào quên gọi `abort()` thì tệp vẫn
 * tiếp tục bay lên kho sau khi người dùng đã đóng form.
 */
export interface FileUploadState {
  /** Đang tải (xin link hoặc gửi bytes) — dùng để khoá nút bấm lần hai. */
  busy: boolean;
  /** Giai đoạn hiện tại, để giao diện báo tiến độ. */
  phase: UploadPhase;
  /** Thông báo lỗi của lần tải gần nhất, `null` khi chưa có lỗi. */
  error: string | null;
  /** `tempKey` của tệp đã tải thành công. */
  tempKey: string | null;
  /**
   * Tải một tệp và trả về `tempKey` của nó.
   *
   * Lỗi được **ném ra** (không nuốt) để người gọi giữ nguyên cách hiển thị lỗi
   * của mình — `useAction` bắt lỗi rồi đưa vào ô báo lỗi của form.
   */
  upload: (file: File) => Promise<string | null>;
  /** Huỷ lần tải đang chạy (nếu có). */
  abort: () => void;
  /** Xoá trạng thái để bắt đầu một lần tải mới. */
  reset: () => void;
}

/** Thông báo khi lần tải bị huỷ — dùng chung để lỗi luôn bằng tiếng Việt. */
const ABORTED_MESSAGE = 'Đã huỷ tải tệp lên.';

/**
 * Upload one file and expose its state.
 *
 * The page keeps the form; this hook keeps the upload.
 */
export function useFileUpload(target: UploadTarget): FileUploadState {
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState<string | null>(null);

  // Giữ controller của lần tải đang chạy để `abort()` huỷ được nó.
  const controllerRef = useRef<AbortController | null>(null);

  // Rời khỏi màn hình thì huỷ tệp đang bay — không để người dùng trả tiền
  // cho một tệp mà họ đã bỏ.
  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setBusy(false);
    setPhase('idle');
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setTempKey(null);
    setPhase('idle');
  }, []);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      // Huỷ lần trước nếu còn đang chạy — hai lần tải cùng lúc sẽ tạo hai
      // tệp mồ côi trên kho, chỉ một cái được dùng.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setBusy(true);
      setError(null);
      setTempKey(null);
      setPhase('linking');

      try {
        const key = await uploadFileApi(target, file, {
          signal: controller.signal,
          onPhase: setPhase,
        });
        setTempKey(key);
        return key;
      } catch (e) {
        // Huỷ có chủ đích không phải lỗi kỹ thuật — nhưng vẫn phải ném ra để
        // người gọi không tưởng rằng tệp đã lên kho.
        const message = controller.signal.aborted
          ? ABORTED_MESSAGE
          : e instanceof Error
            ? e.message
            : 'Không tải được tệp lên kho lưu trữ.';
        setError(message);
        setPhase('idle');
        throw new Error(message);
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setBusy(false);
        }
      }
    },
    [target],
  );

  return { busy, phase, error, tempKey, upload, abort, reset };
}
