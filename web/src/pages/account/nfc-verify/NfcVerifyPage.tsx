import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { setNfcVerified, useCurrentUser } from '@/entities/user';
import {
  NfcPhoneSimulator,
  NfcSessionCard,
  NfcVerificationSimulator,
  useGetNfcSession,
  useGetNfcStatus,
  useNfcPush,
  useStartNfcSession,
} from '@/features/verify-nfc';
import styles from './NfcVerifyPage.module.css';

type NfcLocationState = { returnUrl?: string };

/** Chu kỳ polling trạng thái phiên (fallback khi WebSocket push bị lỡ). */
const SESSION_POLL_MS = 3000;

export function NfcVerifyPage() {
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const startNfcSession = useStartNfcSession();
  const getNfcSession = useGetNfcSession();
  const getNfcStatus = useGetNfcStatus();

  const returnUrl = (location.state as NfcLocationState | null)?.returnUrl;
  const [modalSimulatorOpen, setModalSimulatorOpen] = useState(false);

  // Simulator 5 bước app Moonkage Verify (V1 -> V5 theo Flutter_App_Plan, Flow 6)
  const [appStep, setAppStep] = useState<number>(user.nfcStatus === 'VERIFIED' ? 5 : 1);

  // Phiên xác minh thật: `POST /api/nfc/sessions` -> hiển thị `sessionId` thành QR.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const pollRef = useRef<number | null>(null);

  const isVerified = user.nfcStatus === 'VERIFIED';

  /** Đồng bộ trạng thái định danh từ backend (dữ liệu đã được che). */
  const refreshStatus = useCallback(async () => {
    try {
      const status = await getNfcStatus();
      if (status.nfcStatus === 'VERIFIED') {
        setNfcVerified();
        return status.nfcStatus;
      }
      return status.nfcStatus;
    } catch {
      /* giữ trạng thái hiện tại khi mạng lỗi */
      return null;
    }
  }, [getNfcStatus]);

  /** Mở phiên xác minh mới. */
  const startSession = useCallback(async () => {
    const session = await startNfcSession();
    setSessionId(session.sessionId);
    setExpiresAt(session.expiresAt);
    setSecondsLeft(
      Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
    );
  }, [startNfcSession]);

  // Mở phiên ngay khi người dùng chưa định danh.
  useEffect(() => {
    if (isVerified) return;
    void run(async () => {
      await startSession();
    });
  }, [isVerified, run, startSession]);

  // Đếm ngược hạn của phiên (Q-31: 5 phút).
  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  /** Kết thúc luồng xác minh: đánh dấu đã định danh và quay lại bước trước. */
  const completeVerification = useCallback(() => {
    setNfcVerified();
    toast.success('Xác minh NFC thành công! Tài khoản của bạn đã được định danh.');
    if (returnUrl) {
      navigate(returnUrl);
    }
  }, [navigate, returnUrl]);

  // Realtime: nhận push NFC từ identity-service, không cần chờ polling.
  useNfcPush(sessionId, (message) => {
    if (message.type === 'VERIFIED') {
      completeVerification();
      return;
    }
    if (message.type === 'LOCKED') {
      toast.error('Thẻ bị khoá tạm do quá nhiều lần quét sai. Vui lòng thử lại sau.');
      return;
    }
    if (message.type === 'FAILED' && message.reasonCode) {
      toast.error(`Quét thẻ thất bại (${message.reasonCode}).`);
    }
  });

  // Polling trạng thái phiên: khi app gửi thẻ, phiên chuyển sang VERIFIED.
  useEffect(() => {
    if (!sessionId || isVerified) return;

    const poll = async () => {
      try {
        const status = await getNfcSession(sessionId);
        if (status.status === 'VERIFIED') {
          completeVerification();
          return;
        }
      } catch {
        /* phiên hết hạn hoặc thuộc tài khoản khác: thử mở phiên mới */
      }
      // Fallback: đọc trạng thái định danh của tài khoản (AC-04.11: dữ liệu đã che).
      const accountStatus = await refreshStatus();
      if (accountStatus === 'VERIFIED') {
        completeVerification();
        return;
      }
      if (accountStatus === 'LOCKED') {
        toast.error('Tài khoản đang bị tạm khóa xác minh do quá nhiều lần thử sai.');
        return;
      }
      pollRef.current = window.setTimeout(poll, SESSION_POLL_MS);
    };

    pollRef.current = window.setTimeout(poll, SESSION_POLL_MS);
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, [sessionId, isVerified, completeVerification, refreshStatus, getNfcSession]);

  function handleSimulateAppDone() {
    setNfcVerified();
    setAppStep(5);
    window.setTimeout(() => {
      if (returnUrl) {
        toast.success('Xác thực NFC thành công! Bạn sẽ được đưa trở lại trang thao tác trước đó.');
        navigate(returnUrl);
      }
    }, 1500);
  }

  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>XÁC MINH DANH TÍNH (M6.4, FLOW 6, FR-04)</div>
        <h2 className={styles.title}>Xác Thực Thẻ Căn Cước Công Dân Gắn Chip (NFC)</h2>
        <p className={styles.lead}>
          Đảm bảo tính pháp lý khi giao dịch hợp đồng số lượng lớn hoặc đăng ký trở thành người bán trên
          Moonkage.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Phần Web: QR Code và hướng dẫn (M6.4) */}
        <div className={styles.webSide}>
          <NfcSessionCard
            isVerified={isVerified}
            user={user}
            returnUrl={returnUrl}
            sessionId={sessionId}
            timerLabel={timerLabel}
            busy={busy}
            error={error}
            onRefreshSession={() => {
              void run(async () => {
                await startSession();
                toast.info('Đã tạo mã QR xác minh mới.');
              });
            }}
            onOpenSimulator={() => setModalSimulatorOpen(true)}
          />

          <NfcVerificationSimulator
            isOpen={modalSimulatorOpen}
            onClose={() => setModalSimulatorOpen(false)}
            onSuccess={() => {
              setModalSimulatorOpen(false);
              setAppStep(5);
              if (returnUrl) navigate(returnUrl);
            }}
          />
        </div>

        {/* Phần Giả lập Màn hình App Moonkage Verify (V1-V5) */}
        <NfcPhoneSimulator
          step={appStep}
          user={user}
          onStepChange={setAppStep}
          onFinish={handleSimulateAppDone}
        />
      </div>
    </div>
  );
}
