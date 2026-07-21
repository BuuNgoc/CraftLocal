import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import type { Booking } from '../../types/booking.type';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';

// ─── Countdown Hook ──────────────────────────────────────────────────
function useCountdown(expiresAt: string | undefined) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) { setRemaining(0); return; }
    const expires = new Date(expiresAt).getTime();

    const calc = () => Math.max(0, Math.floor((expires - Date.now()) / 1000));
    setRemaining(calc());

    const interval = setInterval(() => {
      const r = calc();
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return { remaining, display: `${mm}:${ss}` };
}

// ─── Countdown Badge ─────────────────────────────────────────────────
const CountdownBadge: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const { remaining, display } = useCountdown(expiresAt);
  if (remaining <= 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
      <AlertTriangle size={12} /> Hết hạn
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
      remaining <= 120
        ? 'text-red-600 bg-red-50 border-red-200 animate-pulse'
        : 'text-amber-700 bg-amber-50 border-amber-200'
    }`}>
      <Clock size={12} /> Còn {display}
    </span>
  );
};

// ─── Page ────────────────────────────────────────────────────────────
const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchBookings = useCallback(() => {
    bookingApi.getMyBookings()
      .then((res) => setBookings(res.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancelPayment = async (b: Booking) => {
    if (cancellingId) return;
    const confirmed = window.confirm('Bạn có chắc muốn hủy thanh toán? Chỗ đặt sẽ được giải phóng.');
    if (!confirmed) return;

    setCancellingId(b._id);
    try {
      await bookingApi.cancel(b._id, 'USER_CANCELLED_PAYMENT');
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Hủy thất bại');
    } finally {
      setCancellingId(null);
    }
  };

  const handleContinuePayment = async (b: Booking) => {
    try {
      // Try to get existing payment URL or create new
      const paymentRes = await paymentApi.createBookingPayment(b._id);
      const paymentData = paymentRes.data.data;
      if (paymentData.checkoutUrl) {
        window.location.href = paymentData.checkoutUrl;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tiếp tục thanh toán');
    }
  };

  if (loading) return <Loading text="Đang tải lịch đặt trải nghiệm của bạn..." />;

  if (bookings.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-12">
        <EmptyState
          title="Chưa có lịch đặt"
          description="Bạn chưa đặt trải nghiệm workshop nào. Hãy khám phá các hoạt động làm đồ thủ công độc đáo cùng nghệ nhân địa phương!"
          icon={<Calendar size={48} className="text-[#A65A3A] opacity-60" />}
          action={
            <Link to="/workshops">
              <Button>Khám phá trải nghiệm</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Helper: is booking actually pending payment
  const isPendingPayment = (b: Booking) =>
    ['PENDING', 'PENDING_PAYMENT'].includes(b.bookingStatus);

  const isExpired = (b: Booking) =>
    b.bookingStatus === 'EXPIRED' ||
    (isPendingPayment(b) && b.expiresAt && new Date(b.expiresAt).getTime() <= Date.now());

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-10 min-h-screen space-y-6">
      <PageHeader
        title="Lịch đặt trải nghiệm"
        subtitle="Quản lý vé điện tử, thời gian bắt đầu và đánh giá các workshop văn hóa đã tham gia."
      />

      <div className="space-y-4">
        {bookings.map((b) => {
          const dateStr = b.timeslotId?.startTime
            ? new Date(b.timeslotId.startTime).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : '';
          const startStr = b.timeslotId?.startTime
            ? new Date(b.timeslotId.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '';
          const endStr = b.timeslotId?.endTime
            ? new Date(b.timeslotId.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '';

          const expired = isExpired(b);
          const pending = isPendingPayment(b) && !expired;

          return (
            <div
              key={b._id}
              className={`bg-white rounded-2xl border p-5 md:p-6 shadow-2xs hover:shadow-xs transition-all duration-150 relative overflow-hidden ${
                expired ? 'border-red-200 bg-red-50/30' : pending ? 'border-amber-200' : 'border-[#E5E7EB]'
              }`}
            >
              {/* Pending payment top banner */}
              {pending && b.expiresAt && (
                <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 -mx-5 -mt-5 md:-mx-6 md:-mt-6 px-5 md:px-6 py-2.5 mb-4 md:mb-5">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                    <Clock size={14} /> Vui lòng thanh toán trước khi hết hạn
                  </div>
                  <CountdownBadge expiresAt={b.expiresAt} />
                </div>
              )}

              {expired && (
                <div className="flex items-center gap-2 bg-red-50 border-b border-red-200 -mx-5 -mt-5 md:-mx-6 md:-mt-6 px-5 md:px-6 py-2.5 mb-4 md:mb-5">
                  <AlertTriangle size={14} className="text-red-600" />
                  <span className="text-xs font-bold text-red-700">Booking đã hết hạn thanh toán</span>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                      Mã vé: {b.bookingCode || b._id.slice(-8).toUpperCase()}
                    </span>
                    <StatusBadge status={expired ? 'EXPIRED' : b.bookingStatus} type="booking" />
                  </div>
                  
                  <h3 className="text-[15px] font-extrabold text-[#0F172A] leading-tight">
                    {(b.workshopId as any)?.title || 'Workshop Trải Nghiệm'}
                  </h3>

                  {dateStr && (
                    <p className="text-xs text-gray-500 font-semibold flex items-center gap-2">
                      <Calendar size={14} className="text-[#A65A3A]" />
                      <span className="capitalize">{dateStr}</span>
                      <span className="text-gray-200">|</span>
                      <span className="text-[#A65A3A] font-bold">{startStr} - {endStr}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 font-semibold pt-1">
                    <span>Số khách: <strong className="text-gray-900">{b.quantity} người</strong></span>
                    <span>Tổng chi phí: <strong className="text-[#A65A3A]">{formatCurrencyShort(b.totalPrice)}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2.5 w-full md:w-auto shrink-0 border-t border-gray-150 md:border-t-0 pt-4 md:pt-0">
                  {/* PAID/CHECKED_IN/COMPLETED → Show ticket */}
                  {['PAID', 'CHECKED_IN', 'COMPLETED'].includes(b.bookingStatus) && (
                    <Link to={`/my-bookings/${b._id}/ticket`} className="w-full sm:w-auto">
                      <Button size="sm" variant="outline" className="w-full flex items-center justify-center gap-1.5 h-9">
                        <CreditCard size={14} /> Xem vé QR
                      </Button>
                    </Link>
                  )}

                  {/* PENDING_PAYMENT → Continue payment + Cancel */}
                  {pending && (
                    <>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 h-9"
                        onClick={() => handleContinuePayment(b)}
                      >
                        <CreditCard size={14} /> Tiếp tục thanh toán
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 h-9 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancelPayment(b)}
                        disabled={cancellingId === b._id}
                      >
                        <XCircle size={14} /> {cancellingId === b._id ? 'Đang hủy...' : 'Hủy thanh toán'}
                      </Button>
                    </>
                  )}

                  {/* EXPIRED → Re-book */}
                  {expired && (
                    <Link to={`/workshops/${(b.workshopId as any)?._id || b.workshopId}`} className="w-full sm:w-auto">
                      <Button size="sm" variant="outline" className="w-full flex items-center justify-center gap-1.5 h-9">
                        <RefreshCw size={14} /> Đặt lại
                      </Button>
                    </Link>
                  )}

                  {/* Review */}
                  {(b.bookingStatus === 'COMPLETED' || b.bookingStatus === 'CHECKED_IN') && (
                    <Link to={`/review/${b._id}`} className="w-full sm:w-auto">
                      <Button size="sm" variant="secondary" className="w-full flex items-center justify-center gap-1.5 h-9">
                        Viết đánh giá
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyBookingsPage;
