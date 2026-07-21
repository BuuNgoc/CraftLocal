import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ShieldCheck, Printer, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';

const TicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTicket = () => {
    if (!id) {
      setErrorMsg('Thiếu mã booking trong URL');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    bookingApi.getTicket(id)
      .then((res) => {
        setData(res.data.data);
        setErrorMsg('');
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Không tìm thấy thông tin vé hoặc đã xảy ra lỗi.';
        setErrorMsg(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <Loading text="Đang tải vé điện tử..." />;

  if (errorMsg || !data || !data.ticket) {
    return (
      <div className="text-center py-20 bg-[#F7F8FA] min-h-screen flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-amber-500 mb-4" />
        <p className="text-sm text-gray-600 font-semibold mb-2">
          {errorMsg || 'Không tìm thấy thông tin vé hoặc đã xảy ra lỗi.'}
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Booking ID: {id || 'N/A'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchTicket}>
            <RefreshCw size={16} className="mr-2" /> Tải lại
          </Button>
          <Link to="/my-bookings">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" /> Quay lại lịch đặt
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const ticket = data.ticket;
  const qrValue = ticket.qrToken || '';
  const checkInCode = ticket.checkInCode || '';

  const dateStr = ticket.timeslot?.startTime
    ? new Date(ticket.timeslot.startTime).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const startStr = ticket.timeslot?.startTime
    ? new Date(ticket.timeslot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const endStr = ticket.timeslot?.endTime
    ? new Date(ticket.timeslot.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-12 px-5">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/my-bookings" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#A65A3A] transition-colors">
            <ArrowLeft size={15} /> Quay lại lịch đặt
          </Link>
          <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#A65A3A] transition-colors" onClick={() => window.print()}>
            <Printer size={15} /> In vé
          </button>
        </div>

        {/* Electronic Ticket Card */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs print:shadow-none print:border-none">
          {/* Ticket Header */}
          <div className="bg-[#0F172A] p-6 text-white text-center space-y-1">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto text-xl mb-2">🏺</div>
            <h1 className="text-base font-extrabold tracking-wider uppercase">VÉ ĐIỆN TỬ</h1>
            <p className="text-[#FFB597] text-[10px] font-extrabold uppercase tracking-widest">CRAFTLOCAL EXPERIENCES</p>
          </div>

          {/* Ticket Content */}
          <div className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <h2 className="text-[15px] font-extrabold text-gray-900 leading-tight">
                {ticket.workshop?.title || 'Workshop Trải Nghiệm'}
              </h2>
              {dateStr && (
                <div className="inline-flex flex-col items-center text-xs bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 mt-1">
                  <span className="capitalize text-gray-900 font-extrabold">{dateStr}</span>
                  <span className="text-[#A65A3A] font-extrabold mt-0.5">{startStr} - {endStr}</span>
                </div>
              )}
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center py-5 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <QRCodeSVG value={qrValue} size={150} level="H" includeMargin={true} />
              </div>
              <p className="text-[9px] font-mono text-gray-400 mt-3.5 uppercase tracking-widest font-extrabold">
                Mã QR: {qrValue.slice(0, 28)}
              </p>
              <p className="text-[11px] text-gray-500 mt-2 font-semibold text-center px-4 leading-relaxed">
                Vui lòng xuất trình mã QR này cho Hướng dẫn viên khi Check-in.
              </p>
            </div>

            {/* Manual Check-in Code - PROMINENT DISPLAY */}
            <div className="bg-[#FFF8F3] border-2 border-dashed border-[#E8C4A8] rounded-2xl p-5 text-center space-y-3">
              <p className="text-[10px] font-extrabold text-[#A65A3A] uppercase tracking-[0.15em]">
                MÃ CHECK-IN THỦ CÔNG
              </p>
              {checkInCode ? (
                <>
                  <div className="bg-white border border-[#E8C4A8] rounded-xl py-3 px-4 inline-block">
                    <span className="text-2xl font-mono font-black text-[#2F2722] tracking-[0.25em] select-all">
                      {checkInCode}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => handleCopyCode(checkInCode)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A65A3A] text-white text-xs font-bold rounded-lg hover:bg-[#8e492b] transition-all active:scale-95"
                    >
                      {copied ? (
                        <><Check size={13} /> Đã sao chép!</>
                      ) : (
                        <><Copy size={13} /> Sao chép mã</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-amber-600 font-semibold">
                  <RefreshCw size={14} className="animate-spin" />
                  Đang cập nhật mã check-in, vui lòng tải lại.
                </div>
              )}
              <p className="text-[11px] text-[#7A6255] font-semibold leading-relaxed">
                Nếu không quét được QR, vui lòng cung cấp mã này cho hướng dẫn viên để check-in.
              </p>
            </div>

            {/* Metadata list */}
            <div className="space-y-3 text-xs font-semibold border-t border-gray-150 pt-4">
              <div className="flex justify-between items-center text-gray-500">
                <span>Mã giao dịch</span>
                <span className="text-gray-900 font-extrabold font-mono text-xs">{data.bookingCode || ''}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Số lượng người tham gia</span>
                <span className="text-gray-900 font-extrabold">{data.quantity} người</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Trạng thái vé</span>
                <StatusBadge status={data.bookingStatus} type="booking" />
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Trạng thái check-in</span>
                <StatusBadge status={ticket.status === 'USED' ? 'CHECKED_IN' : ticket.status} type="booking" />
              </div>
            </div>
          </div>

          {/* Ticket Footer / Security Check */}
          <div className="bg-gray-50 border-t border-dashed border-gray-200 p-4.5 text-center flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-bold">
            <ShieldCheck size={15} className="text-[#16A34A] shrink-0" />
            <span>ĐÃ XÁC MINH BỞI HỆ THỐNG CRAFTLOCAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPage;
