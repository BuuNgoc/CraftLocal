import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Ticket, User, Copy, Check } from 'lucide-react';
import tourGuideApi from '../../api/tourGuideApi';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

const CustomerListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    tourGuideApi.getCustomers(id)
      .then((res) => setCustomers(res.data.data || []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = async (code: string, bookingId: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(bookingId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) return <Loading text="Đang tải danh sách khách hàng..." />;

  const paidCount = customers.filter((c) => c.bookingStatus === 'PAID').length;
  const checkedInCount = customers.filter((c) => ['CHECKED_IN', 'COMPLETED'].includes(c.bookingStatus)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Danh sách khách hàng" subtitle="Tra cứu danh sách khách đặt chỗ và tình trạng check-in." />
        <button
          onClick={() => navigate('/tour-guide/schedules')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#7A6A5E] hover:text-[#A65A3A] transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại lịch trình
        </button>
      </div>

      {/* Stats Bar */}
      {customers.length > 0 && (
        <div className="flex gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center flex-1">
            <p className="text-lg font-extrabold text-blue-700">{customers.length}</p>
            <p className="text-[10px] text-blue-500 font-bold uppercase">Tổng đăng ký</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center flex-1">
            <p className="text-lg font-extrabold text-amber-700">{paidCount}</p>
            <p className="text-[10px] text-amber-500 font-bold uppercase">Chờ check-in</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-center flex-1">
            <p className="text-lg font-extrabold text-green-700">{checkedInCount}</p>
            <p className="text-[10px] text-green-500 font-bold uppercase">Đã check-in</p>
          </div>
        </div>
      )}

      {customers.length === 0 ? (
        <EmptyState title="Không có khách hàng" description="Chưa có khách nào đăng ký hoặc đặt vé cho khung giờ này." />
      ) : (
        <div className="bg-white rounded-3xl border border-[#E6DED5] overflow-hidden shadow-xs">
          <div className="divide-y divide-[#E6DED5]/50">
            {customers.map((c: any) => (
              <div
                key={c._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-[#FAF7F2]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#A65A3A]/10 border border-[#A65A3A]/25 flex items-center justify-center font-bold text-[#A65A3A] text-sm shrink-0">
                    {(c.customerInfo?.fullName || c.touristId?.fullName || 'K')[0].toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-[#2F2722] text-[15px]">
                      {c.customerInfo?.fullName || c.touristId?.fullName || 'Khách đăng ký'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#7A6A5E] font-medium">
                      <span className="flex items-center gap-1"><Ticket size={12} className="text-[#A65A3A]" /> {c.quantity} khách</span>
                      <span className="text-[#E6DED5]">|</span>
                      <span>Mã: <strong className="font-mono text-[11px] text-[#2F2722]">{c.bookingCode || c._id.slice(-8).toUpperCase()}</strong></span>
                    </div>
                    {/* Show check-in code if ticket exists */}
                    {c.ticket?.checkInCode && c.bookingStatus === 'PAID' && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#A65A3A] font-bold">Check-in:</span>
                        <span className="font-mono text-xs font-bold text-[#2F2722] bg-[#FFF8F3] px-1.5 py-0.5 rounded border border-[#E8C4A8]">
                          {c.ticket.checkInCode}
                        </span>
                        <button
                          onClick={() => handleCopy(c.ticket.checkInCode, c._id)}
                          className="p-0.5 text-gray-400 hover:text-[#A65A3A] transition-colors"
                          title="Sao chép mã check-in"
                        >
                          {copiedId === c._id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {c.bookingStatus === 'CHECKED_IN' || c.bookingStatus === 'COMPLETED' ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-150 rounded-full text-green-700 text-xs font-bold">
                      <CheckCircle size={13} strokeWidth={2.5} /> Đã check-in
                    </span>
                  ) : (
                    <StatusBadge status={c.bookingStatus} type="booking" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerListPage;
