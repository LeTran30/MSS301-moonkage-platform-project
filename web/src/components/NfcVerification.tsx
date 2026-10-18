import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Ecc } from '../utils/qrcodegen';

interface SessionData {
  sessionId: string;
  expiresAt: string;
}

function getRemainingSeconds(expiresAt: string): number {
  const expTime = new Date(expiresAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((expTime - now) / 1000));
}

export const NfcVerification: React.FC = () => {
  // Configuration & Auth State
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://localhost:8080');
  const [username, setUsername] = useState<string>('demo@moonkage.vn');
  const [password, setPassword] = useState<string>('123456');
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email?: string; fullName?: string } | null>(null);

  // Session State
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'PENDING' | 'VERIFIED' | 'EXPIRED' | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);

  // UI State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Clean intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 1. Handle Login
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/identity-service/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Đăng nhập thất bại.');
      }

      const tokenValue = json.data?.token || json.token;
      if (!tokenValue) {
        throw new Error('Không tìm thấy token trong phản hồi API.');
      }

      setToken(tokenValue);
      setCurrentUser({
        email: json.data?.email || username,
        fullName: json.data?.fullName || 'Người dùng Moonkage',
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Create NFC Session
  const createNfcSession = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    try {
      const res = await fetch(`${apiBaseUrl}/identity-service/api/nfc-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Không thể tạo phiên NFC.');
      }

      const sessionData: SessionData = json.data || json;
      setSession(sessionData);
      setSessionStatus('PENDING');

      // Generate QR Code format: moonkage-verify:v1:<sessionId>
      const qrPayload = `moonkage-verify:v1:${sessionData.sessionId}`;
      const qr = QrCode.encodeText(qrPayload, Ecc.MEDIUM);
      setQrSvg(qr.toSvgString(2));

      // Calculate initial countdown
      setCountdown(getRemainingSeconds(sessionData.expiresAt));

      // Start countdown timer
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setSessionStatus('EXPIRED');
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling session status
      startPolling(sessionData.sessionId, token);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo phiên xác thực.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Poll Session Status
  const startPolling = (sessionId: string, authToken: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/identity-service/api/nfc-sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.status === 410) {
          setSessionStatus('EXPIRED');
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }

        if (res.ok) {
          const json = await res.json();
          const status = json.data?.status || json.status;
          if (status === 'VERIFIED') {
            setSessionStatus('VERIFIED');
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          }
        }
      } catch {
        // Ignore network blips during polling
      }
    }, 2000);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100 my-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Xác thực CCCD qua Mobile NFC</h2>
        <p className="text-slate-500 text-sm mt-1">Cổng kết nối Backend Moonkage Demo</p>
      </div>

      {/* Gateway Address Config */}
      <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <label className="block text-xs font-semibold text-slate-500 mb-1">API GATEWAY URL</label>
        <input
          type="text"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
          placeholder="http://localhost:8080"
          className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          * Đặt <code>http://localhost:8080</code> khi chạy cùng máy, hoặc IP Hotspot (VD: <code>http://192.168.137.1:8080</code>)
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Not Logged In */}
      {!token ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Đăng nhập tài khoản kiểm thử</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email / Tài khoản</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition duration-150 shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập & Tiếp tục'}
          </button>
        </form>
      ) : (
        /* STEP 2: Logged In -> Create Session & Show QR */
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
            <div>
              <span className="text-slate-500">Đã đăng nhập:</span>{' '}
              <strong className="text-slate-800">{currentUser?.email}</strong>
            </div>
            <button
              onClick={() => {
                setToken(null);
                setSession(null);
              }}
              className="text-indigo-600 hover:underline font-medium"
            >
              Đổi tài khoản
            </button>
          </div>

          {!session ? (
            <div className="text-center py-6">
              <button
                onClick={createNfcSession}
                disabled={loading}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? 'Đang tạo phiên...' : 'Tạo mã QR phiên xác thực'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* QR Code Container */}
              <div className="relative p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center">
                <div
                  className="w-56 h-56 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />

                {/* Status Overlays */}
                {sessionStatus === 'VERIFIED' && (
                  <div className="absolute inset-0 bg-emerald-500/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in">
                    <div className="w-14 h-14 bg-white text-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold">Xác minh thành công!</h4>
                    <p className="text-xs text-emerald-100 mt-1">Dữ liệu thẻ CCCD đã được ghi nhận vào hệ thống.</p>
                  </div>
                )}

                {sessionStatus === 'EXPIRED' && (
                  <div className="absolute inset-0 bg-slate-800/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center">
                    <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-sm">Phiên đã hết hạn</h4>
                    <p className="text-xs text-slate-300 mt-1">Vui lòng tạo phiên mới để tiếp tục.</p>
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="mt-4 flex flex-col items-center gap-1.5">
                {sessionStatus === 'PENDING' && (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Đang chờ quét QR và chạm thẻ CCCD...
                    </div>
                    <p className="text-xs text-slate-500">
                      Thời gian còn lại: <strong className="font-mono text-slate-700">{formatTime(countdown)}</strong>
                    </p>
                  </>
                )}
                {sessionStatus === 'VERIFIED' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Đã hoàn tất xác thực (VERIFIED)
                  </div>
                )}
              </div>

              {/* Raw Payload info */}
              <div className="mt-4 w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Mã định danh phiên (Session ID)</p>
                <code className="text-xs font-mono text-indigo-600 select-all font-semibold">
                  {session.sessionId}
                </code>
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={createNfcSession}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                >
                  Tạo phiên mới
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default NfcVerification;
