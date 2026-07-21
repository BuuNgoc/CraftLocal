import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, Clock, QrCode, ClipboardList, ArrowRight,
  CheckCircle, AlertCircle, BarChart3, MapPin,
} from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';

const TourGuideDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardApi.getTourGuideStats()
      .then((res) => setData(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải bảng thống kê..." />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4">
          <BarChart3 size={28} />
        </div>
        <h3 className="text-lg font-bold text-[#111827]">Không thể tải dữ liệu</h3>
        <p className="text-sm text-[#6B7280] mt-1">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  const { stats, recent } = data;

  const statCards = [
    { title: 'Lịch hôm nay', value: stats.todaySchedules, icon: <Calendar size={18} />, desc: 'Buổi hướng dẫn hôm nay', highlight: stats.todaySchedules > 0 },
    { title: 'Lịch sắp tới', value: stats.upcomingSchedules, icon: <Clock size={18} />, desc: 'Buổi chưa diễn ra' },
    { title: 'Khách cần check-in', value: stats.pendingCheckins, icon: <AlertCircle size={18} />, desc: 'Vé PAID chưa check-in', highlight: stats.pendingCheckins > 0 },
    { title: 'Khách đã check-in', value: stats.checkedInCustomers, icon: <CheckCircle size={18} />, desc: `${stats.totalCustomers} tổng khách` },
    { title: 'Buổi hoàn thành', value: stats.completedTimeslots, icon: <ClipboardList size={18} />, desc: `${stats.totalAssignedTimeslots} tổng được gán` },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Tổng quan Hướng dẫn viên</h1>
        <p className="text-sm text-[#6B7280] mt-1">Theo dõi lịch hướng dẫn và check-in khách.</p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md ${
              card.highlight ? 'border-[#A65A3A]/40 bg-[#FEF7F2]' : 'border-[#E5E7EB]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className={`p-2 rounded-lg ${card.highlight ? 'bg-[#A65A3A]/10 text-[#A65A3A]' : 'bg-[#F3F4F6] text-[#A65A3A]'}`}>
                {card.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#111827]">{card.value}</h3>
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mt-1">{card.title}</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          to="/tour-guide/check-in"
          className="flex items-center gap-5 p-6 bg-[#A65A3A] text-white rounded-2xl hover:bg-[#8e492b] transition-all shadow-md hover:shadow-lg group"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/25">
            <QrCode size={28} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Quét mã check-in QR</p>
            <p className="text-white/80 text-xs font-medium mt-0.5">Xác nhận vé điện tử của khách hàng tại quầy</p>
          </div>
          <ArrowRight size={20} className="text-white/60 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/tour-guide/schedules"
          className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-[#E5E7EB] hover:shadow-md transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#A65A3A]/10 flex items-center justify-center border border-[#A65A3A]/20 text-[#A65A3A]">
            <Calendar size={28} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg text-[#111827] group-hover:text-[#A65A3A] transition-colors">Lịch trình gán</p>
            <p className="text-[#6B7280] text-xs font-medium mt-0.5">Xem lịch làm việc chi tiết và danh sách khách</p>
          </div>
          <ArrowRight size={20} className="text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Today's Schedule + Recent Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Timeslots */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-4">Lịch hôm nay</h2>
          <div className="space-y-3">
            {(recent.todayTimeslots || []).length > 0 ? recent.todayTimeslots.map((ts: any) => (
              <div key={ts._id} className="p-4 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111827] truncate">{ts.workshopId?.title || 'Workshop'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 text-[#6B7280]">
                        <Clock size={12} />
                        <span className="text-xs font-medium">
                          {new Date(ts.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {' — '}
                          {new Date(ts.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {ts.workshopId?.locationLabel && (
                        <div className="flex items-center gap-1 text-[#6B7280]">
                          <MapPin size={12} />
                          <span className="text-xs font-medium truncate">{ts.workshopId.locationLabel}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[#6B7280] mt-1">
                      <Users size={12} />
                      <span className="text-xs font-medium">{ts.bookedSlots}/{ts.totalSlots} khách</span>
                    </div>
                  </div>
                  <StatusBadge status={ts.status} type="timeslot" />
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    to={`/tour-guide/timeslots/${ts._id}/customers`}
                    className="text-xs font-bold text-[#A65A3A] px-3 py-1.5 bg-[#A65A3A]/10 rounded-lg hover:bg-[#A65A3A]/20 transition-colors"
                  >
                    Xem khách
                  </Link>
                  <Link
                    to="/tour-guide/check-in"
                    className="text-xs font-bold text-white px-3 py-1.5 bg-[#A65A3A] rounded-lg hover:bg-[#8e492b] transition-colors"
                  >
                    Check-in QR
                  </Link>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Calendar size={32} className="text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Không có lịch hôm nay</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-4">Check-in gần đây</h2>
          <div className="space-y-2">
            {(recent.recentCheckins || []).length > 0 ? recent.recentCheckins.map((b: any) => (
              <div key={b._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {b.touristId?.avatar ? (
                    <img src={b.touristId.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#A65A3A]/10 flex items-center justify-center text-[#A65A3A] font-bold text-xs">
                      {(b.touristId?.fullName || '?')[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{b.touristId?.fullName || b.customerInfo?.fullName || '—'}</p>
                    <p className="text-xs text-[#6B7280] truncate">{b.workshopId?.title || 'Workshop'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={b.bookingStatus} type="booking" />
                  {b.checkedInAt && (
                    <p className="text-[10px] text-[#6B7280] mt-0.5">
                      {new Date(b.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <QrCode size={32} className="text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Chưa có check-in nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourGuideDashboardPage;
