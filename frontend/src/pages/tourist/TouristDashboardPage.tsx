import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, QrCode, ShoppingBag, Bell, ArrowRight,
  Compass, User, BarChart3, Ticket, Clock,
} from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';

const TouristDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardApi.getTouristStats()
      .then((res) => setData(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải bảng điều khiển..." />;

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
    { title: 'Lịch đặt', value: stats.totalBookings, icon: <CalendarCheck size={18} />, desc: `${stats.upcomingBookings} sắp tới`, color: 'bg-blue-50 text-blue-600' },
    { title: 'Vé hoạt động', value: stats.paidBookings, icon: <Ticket size={18} />, desc: `${stats.completedBookings} đã hoàn thành`, color: 'bg-green-50 text-green-600' },
    { title: 'Đơn hàng', value: stats.totalOrders, icon: <ShoppingBag size={18} />, desc: `${stats.pendingOrders} chờ xử lý`, color: 'bg-amber-50 text-amber-600' },
    { title: 'Thông báo', value: stats.unreadNotifications, icon: <Bell size={18} />, desc: 'Chưa đọc', highlight: stats.unreadNotifications > 0, color: 'bg-red-50 text-red-500' },
  ];

  const quickActions = [
    { label: 'Khám phá Workshop', desc: 'Tìm trải nghiệm thủ công mới', to: '/workshops', icon: <Compass size={18} /> },
    { label: 'Vé của tôi', desc: 'Xem vé QR đã đặt', to: '/my-bookings', icon: <QrCode size={18} /> },
    { label: 'Đơn hàng', desc: 'Theo dõi đơn hàng sản phẩm', to: '/my-orders', icon: <ShoppingBag size={18} /> },
    { label: 'Hồ sơ cá nhân', desc: 'Cập nhật thông tin', to: '/profile', icon: <User size={18} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Bảng điều khiển của tôi</h1>
        <p className="text-sm text-[#6B7280] mt-1">Theo dõi lịch đặt, vé QR và đơn hàng.</p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
              card.highlight ? 'border-[#DC2626]/30 bg-[#FEF2F2]' : 'border-[#E5E7EB]'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              {card.icon}
            </div>
            <h3 className="text-2xl font-bold text-[#111827]">{card.value}</h3>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mt-1">{card.title}</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111827]">Booking sắp tới</h2>
            <Link to="/my-bookings" className="text-xs font-bold text-[#A65A3A] hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-3">
            {(recent.upcomingBookings || []).length > 0 ? recent.upcomingBookings.map((b: any) => (
              <div key={b._id} className="flex items-center justify-between p-4 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {b.workshopId?.thumbnail || (b.workshopId?.images && b.workshopId.images[0]) ? (
                    <img
                      src={b.workshopId?.thumbnail || b.workshopId?.images?.[0]}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#A65A3A]/10 flex items-center justify-center text-[#A65A3A] shrink-0">
                      <Compass size={20} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111827] truncate">{b.workshopId?.title || 'Workshop'}</p>
                    {b.timeslotId && (
                      <div className="flex items-center gap-1 text-[#6B7280] mt-0.5">
                        <Clock size={11} />
                        <span className="text-xs font-medium">
                          {new Date(b.timeslotId.startTime).toLocaleDateString('vi-VN')} · {new Date(b.timeslotId.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-[#6B7280] mt-0.5">{b.quantity} khách · {formatCurrencyShort(b.totalPrice)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                  <StatusBadge status={b.bookingStatus} type="booking" />
                  {b.bookingStatus === 'PAID' && (
                    <Link
                      to={`/my-bookings/${b._id}/ticket`}
                      className="text-[10px] font-bold text-[#A65A3A] hover:underline"
                    >
                      Xem vé QR
                    </Link>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <CalendarCheck size={32} className="text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Chưa có booking sắp tới</p>
                <Link to="/workshops" className="text-xs font-bold text-[#A65A3A] hover:underline mt-2 inline-block">Khám phá workshop →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-4">Thao tác nhanh</h2>
          <div className="space-y-1.5">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F9FAFB] transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#A65A3A]/10 flex items-center justify-center text-[#A65A3A] group-hover:bg-[#A65A3A]/20 transition-colors">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] group-hover:text-[#A65A3A] transition-colors">{a.label}</p>
                  <p className="text-[10px] text-[#6B7280] truncate">{a.desc}</p>
                </div>
                <ArrowRight size={14} className="text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111827]">Đơn hàng gần đây</h2>
            <Link to="/my-orders" className="text-xs font-bold text-[#A65A3A] hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-2">
            {(recent.recentOrders || []).length > 0 ? recent.recentOrders.map((o: any) => (
              <div key={o._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{o.orderCode}</p>
                  <p className="text-xs text-[#6B7280]">{formatCurrencyShort(o.totalAmount)} · {new Date(o.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <StatusBadge status={o.orderStatus} type="order" />
              </div>
            )) : (
              <div className="text-center py-6">
                <ShoppingBag size={28} className="text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Chưa có đơn hàng</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Notifications */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111827]">Thông báo mới</h2>
            <Link to="/notifications" className="text-xs font-bold text-[#A65A3A] hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-2">
            {(recent.latestNotifications || []).length > 0 ? recent.latestNotifications.map((n: any) => (
              <div key={n._id} className={`p-3 rounded-xl transition-colors ${n.isRead ? 'hover:bg-[#F9FAFB]' : 'bg-blue-50/50 hover:bg-blue-50'}`}>
                <p className={`text-sm truncate ${n.isRead ? 'text-[#111827]' : 'font-bold text-[#111827]'}`}>{n.title}</p>
                <p className="text-xs text-[#6B7280] truncate mt-0.5">{n.message}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            )) : (
              <div className="text-center py-6">
                <Bell size={28} className="text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Không có thông báo mới</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouristDashboardPage;
