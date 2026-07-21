import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  /** Called when a QR code is successfully scanned */
  onScan: (decodedText: string) => void;
  /** Whether scanning is active (controls start/stop) */
  active: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, active }) => {
  const scannerContainerId = useRef(`qr-scanner-${Math.random().toString(36).slice(2, 9)}`);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);
  const startedRef = useRef(false);

  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Cleanup function
  const stopScanner = async () => {
    const scanner = html5QrCodeRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
        console.log('[QRScanner] Scanner stopped');
      }
    } catch (err) {
      // Ignore stop errors — scanner may already be stopped
      console.log('[QRScanner] Stop error (safe to ignore):', err);
    }
    try {
      scanner.clear();
      console.log('[QRScanner] Scanner cleared');
    } catch {
      // Ignore clear errors
    }
    html5QrCodeRef.current = null;
    startedRef.current = false;
  };

  // Start scanner
  const startScanner = async () => {
    // Prevent double-start
    if (startedRef.current || html5QrCodeRef.current?.isScanning) {
      console.log('[QRScanner] Already started, skipping');
      return;
    }

    setIsInitializing(true);
    setCameraError('');

    try {
      // Get available cameras
      const cameras = await Html5Qrcode.getCameras();
      console.log('[QRScanner] Cameras:', cameras);

      if (!cameras || cameras.length === 0) {
        setCameraError('Không tìm thấy camera nào. Vui lòng kiểm tra thiết bị.');
        setIsInitializing(false);
        return;
      }

      // Prefer back camera, fallback to first
      const backCamera = cameras.find(
        (c) =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment') ||
          c.label.toLowerCase().includes('sau')
      );
      const selectedCamera = backCamera || cameras[0];
      console.log('[QRScanner] Selected camera:', selectedCamera.label, selectedCamera.id);

      // Check if container element exists
      const containerEl = document.getElementById(scannerContainerId.current);
      if (!containerEl) {
        console.error('[QRScanner] Container element not found');
        setCameraError('Lỗi khởi tạo scanner. Vui lòng tải lại trang.');
        setIsInitializing(false);
        return;
      }

      // Create Html5Qrcode instance
      const html5QrCode = new Html5Qrcode(scannerContainerId.current, {
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      // Start scanning
      await html5QrCode.start(
        selectedCamera.id,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // SUCCESS callback
          if (processingRef.current) return; // debounce
          processingRef.current = true;

          console.log('[QRScanner] QR scanned:', decodedText);

          // Stop scanner immediately after successful scan
          stopScanner().then(() => {
            if (mountedRef.current) {
              onScan(decodedText);
            }
          });
        },
        (_errorMessage) => {
          // FAILURE callback — called every frame when no QR found, ignore silently
        }
      );

      startedRef.current = true;
      console.log('[QRScanner] Scanner started successfully');

      if (mountedRef.current) {
        setIsInitializing(false);
      }
    } catch (err: any) {
      console.error('[QRScanner] QR scanner error:', err);
      if (mountedRef.current) {
        setIsInitializing(false);
        const message =
          err?.message || err?.toString() || 'Không thể khởi tạo camera';

        if (message.includes('NotAllowedError') || message.includes('Permission')) {
          setCameraError('Bạn chưa cấp quyền camera. Vui lòng cho phép truy cập camera trong trình duyệt.');
        } else if (message.includes('NotFoundError') || message.includes('DevicesNotFound')) {
          setCameraError('Không tìm thấy camera nào trên thiết bị.');
        } else if (message.includes('NotReadableError') || message.includes('TrackStartError')) {
          setCameraError('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó và thử lại.');
        } else {
          setCameraError(`Lỗi camera: ${message}`);
        }
      }
    }
  };

  // Effect: start/stop based on `active` prop
  useEffect(() => {
    mountedRef.current = true;
    processingRef.current = false;

    if (active) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          startScanner();
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
        stopScanner();
      };
    } else {
      stopScanner();
      return () => {
        mountedRef.current = false;
      };
    }
  }, [active]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  return (
    <div className="relative">
      {/* Scanner container — html5-qrcode renders video inside this div */}
      <div
        id={scannerContainerId.current}
        className="bg-[#2F2722] rounded-[32px] overflow-hidden shadow-lg border border-[#E6DED5]"
        style={{ minHeight: 300 }}
      />

      {/* Initializing overlay */}
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[32px]">
          <div className="text-center text-white/70 space-y-2">
            <QrCode size={52} className="mx-auto text-[#EADCCB] opacity-70 animate-pulse" />
            <p className="text-sm font-bold text-white">Đang khởi tạo camera...</p>
            <p className="text-xs text-white/50">Vui lòng cho phép truy cập camera</p>
          </div>
        </div>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-[32px] px-6">
          <div className="text-center space-y-3">
            <AlertCircle size={40} className="mx-auto text-red-400" />
            <p className="text-sm font-bold text-white">{cameraError}</p>
            <p className="text-xs text-white/50">Bạn có thể nhập mã thủ công bên dưới.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
