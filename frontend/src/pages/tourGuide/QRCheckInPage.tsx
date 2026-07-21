import React, { useState, useRef } from 'react';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Camera, Keyboard, User, Clock, MapPin } from 'lucide-react';
import tourGuideApi from '../../api/tourGuideApi';
import QRScanner from '../../components/qr/QRScanner';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';

type ScanMode = 'manual' | 'camera';

const QRCheckInPage: React.FC = () => {
  const [mode, setMode] = useState<ScanMode>('manual');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState<any>(null);
  const [scannerActive, setScannerActive] = useState(false);

  const processingRef = useRef(false);

  /**
   * Handle check-in API call — shared between manual input and camera scan
   * Uses the same endpoint regardless of source
   */
  const handleCheckIn = async (checkCode: string) => {
    const trimmed = checkCode.trim();
    if (!trimmed) {
      setError('Vui lòng nhập mã QR hoặc mã check-in');
      return;
    }

    // Prevent double calls
    if (processingRef.current || loading) return;
    processingRef.current = true;

    setLoading(true);
    setError('');
    setSuccess('');
    setResult(null);

    try {
      const res = await tourGuideApi.checkInByCode(trimmed);
      setResult(res.data.data);
      setSuccess(res.data.message || 'Check-in thành công!');
      setCode('');
      // Stop camera after successful scan
      setScannerActive(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Check-in thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
      // Allow reprocessing after a short delay to prevent rapid re-scans
      setTimeout(() => {
        processingRef.current = false;
      }, 2000);
    }
  };

  /**
   * Called by QRScanner when a QR code is detected
   */
  const handleQRScan = (decodedText: string) => {
    console.log('[QRCheckInPage] QR scanned:', decodedText);
    handleCheckIn(decodedText);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(code);
  };

  const handleSwitchMode = (newMode: ScanMode) => {
    // Stop scanner when switching away from camera
    if (newMode !== 'camera') {
      setScannerActive(false);
    }
    setMode(newMode);
    setError('');
    setSuccess('');
    setResult(null);
    setCode('');
    processingRef.current = false;

    // Activate scanner when switching to camera mode
    if (newMode === 'camera') {
      // Small delay to let React render the scanner container first
      setTimeout(() => setScannerActive(true), 100);
    }
  };

  const handleReset = () => {
    setError('');
    setSuccess('');
    setResult(null);
    setCode('');
    processingRef.current = false;

    if (mode === 'camera') {
      // Reactivate scanner for next scan
      setScannerActive(false);
      setTimeout(() => setScannerActive(true), 300);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-10">
      <div className="text-center">
        <PageHeader title="Check-in du khách" subtitle="Quét mã QR hoặc nhập mã check-in trên vé để xác nhận tham gia workshop." />
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2 bg-gray-100 rounded-2xl p-1">
        <button
          onClick={() => handleSwitchMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'manual'
              ? 'bg-white text-[#2F2722] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Keyboard size={15} /> Nhập mã thủ công
        </button>
        <button
          onClick={() => handleSwitchMode('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'camera'
              ? 'bg-white text-[#2F2722] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Camera size={15} /> Quét QR bằng camera
        </button>
      </div>

      {/* Camera Mode — QR Scanner */}
      {mode === 'camera' && (
        <QRScanner onScan={handleQRScan} active={scannerActive} />
      )}

      {/* Manual Input — always visible as primary or fallback */}
      <form onSubmit={handleManualSubmit} className="bg-white rounded-3xl border border-[#E6DED5] p-5 shadow-sm space-y-4">
        <p className="text-xs font-bold text-[#2F2722] uppercase tracking-wider">
          {mode === 'camera' ? 'Hoặc nhập mã thủ công' : 'Nhập mã QR hoặc mã check-in trên vé'}
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); setSuccess(''); setResult(null); }}
              placeholder="Nhập mã QR hoặc mã check-in trên vé"
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            className="shrink-0 h-11 px-5 shadow-xs"
            isLoading={loading}
            disabled={!code.trim() || loading}
          >
            Xác nhận
          </Button>
        </div>
      </form>

      {/* Success Result Card */}
      {success && result && (
        <div className="bg-green-50/50 border border-green-200 rounded-3xl p-6 space-y-4 transition-all">
          <div className="text-center space-y-2">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <p className="font-bold text-lg text-[#2F855A]">Check-in thành công!</p>
            <p className="text-xs text-green-600 font-semibold">{success}</p>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-green-200 p-4 space-y-3">
            {result.customer?.fullName && (
              <div className="flex items-center gap-3">
                <User size={16} className="text-[#A65A3A] shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Khách hàng</p>
                  <p className="text-sm font-bold text-gray-900">{result.customer.fullName}</p>
                </div>
              </div>
            )}
            {result.workshop?.title && (
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-[#A65A3A] shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Workshop</p>
                  <p className="text-sm font-bold text-gray-900">{result.workshop.title}</p>
                </div>
              </div>
            )}
            {result.timeslot && (
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-[#A65A3A] shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Khung giờ</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(result.timeslot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(result.timeslot.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all"
          >
            Check-in khách tiếp theo
          </button>
        </div>
      )}

      {/* Error Result */}
      {error && !success && (
        <div className={`p-6 rounded-3xl text-center border transition-all ${
          error.includes('đã được sử dụng')
            ? 'bg-amber-50/50 border-amber-200'
            : 'bg-red-50/50 border-red-200'
        }`}>
          {error.includes('đã được sử dụng') ? (
            <div className="space-y-2">
              <AlertTriangle size={40} className="mx-auto text-amber-500" />
              <p className="font-bold text-base text-amber-700">Vé đã được sử dụng</p>
              <p className="text-xs text-amber-600 font-semibold">{error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <XCircle size={40} className="mx-auto text-red-500" />
              <p className="font-bold text-base text-[#C53030]">Check-in thất bại</p>
              <p className="text-xs text-red-500 font-semibold">{error}</p>
            </div>
          )}
          <button
            onClick={handleReset}
            className="mt-4 px-5 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCheckInPage;
