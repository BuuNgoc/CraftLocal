import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CalendarCheck, DollarSign, ShoppingBag, Plus, UserPlus,
  ArrowRight, AlertTriangle, Star, Users, Package, Clock, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import dashboardApi from '../../api/dashboardApi';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';

const COLORS = ['#A65A3A', '#2563EB', '#16A34A', '#D97706', '#DC2626', '#8B5CF6', '#EC4899'];

const HostDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardApi.getHostStats()
      .then((res) => setData(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải dữ liệu thống kê chủ xưởng..." />;

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

  const { stats, charts, recent } = data;

  const quickActions = [
    { label: 'Tạo Workshop', desc: 'Thêm trải nghiệm mới', to: '/host/workshops/create', icon: <Plus size={18} /> },
    { label: 'Quản lý khung giờ', desc: 'Thêm, sửa lịch trải nghiệm', to: '/host/timeslots', icon: <Clock size={18} /> },
    { label: 'Thêm sản phẩm', desc: 'Đăng sản phẩm bán', to: '/host/products/create', icon: <Package size={18} /> },
    { label: 'Quản lý HĐV', desc: 'Danh sách hướng dẫn viên', to: '/host/tour-guides', icon: <UserPlus size={18} /> },
    { label: 'Gán HĐV', desc: 'Phân công cho workshop', to: '/host/assign-guide', icon: <UserPlus size={18} /> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Tổng quan Chủ xưởng</h1>
        <p className="text-sm text-[#6B7280] mt-1">Quản lý workshop, lịch trải nghiệm, đơn hàng và doanh thu.</p>
      </div>

      {/* Warning Cards */}
      {(stats.workshopsWithoutTimeslots > 0 || stats.outOfStockProducts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.workshopsWithoutTimeslots > 0 && (
            <div className="bg-[#FFFBEB] border border-[#D97706]/30 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-[#D97706]/10 rounded-lg text-[#D97706] mt-0.5"><AlertTriangle size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#92400E]">Có {stats.workshopsWithoutTimeslots} workshop chưa có khung giờ</p>
                <p className="text-xs text-[#A16207] mt-0.5">Khách chưa thể đặt trải nghiệm tại các workshop này.</p>
                <Link to="/host/timeslots" className="text-xs font-bold text-[#D97706] hover:underline mt-2 inline-block">Thêm khung giờ →</Link>
              </div>
            </div>
          )}
          {stats.outOfStockProducts > 0 && (
            <div className="bg-[#FEF2F2] border border-[#DC2626]/30 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-[#DC2626]/10 rounded-lg text-[#DC2626] mt-0.5"><Package size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#991B1B]">Có {stats.outOfStockProducts} sản phẩm đã hết hàng</p>
                <p className="text-xs text-[#B91C1C] mt-0.5">Khách không thể mua các sản phẩm này.</p>
                <Link to="/host/products" className="text-xs font-bold text-[#DC2626] hover:underline mt-2 inline-block">Cập nhật tồn kho →</Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { title: 'Workshop', value: stats.activeWorkshops, icon: <BookOpen size={18} />, desc: `${stats.totalWorkshops} tổng` },
          { title: 'Khung giờ hôm nay', value: stats.todayTimeslots, icon: <Clock size={18} />, desc: `${stats.totalTimeslots} tổng` },
          { title: 'Booking đã TT', value: stats.paidBookings, icon: <CalendarCheck size={18} />, desc: `${stats.checkedInBookings} đã check-in` },
          { title: 'Đơn hàng chờ', value: stats.pendingOrders, icon: <ShoppingBag size={18} />, desc: `${stats.totalOrders} tổng`, highlight: stats.pendingOrders > 0 },
          { title: 'Sản phẩm', value: stats.totalProducts, icon: <Package size={18} />, desc: `${stats.outOfStockProducts} hết hàng` },
          { title: 'Doanh thu tháng', value: formatCurrencyShort(stats.monthlyRevenue || 0), icon: <DollarSign size={18} />, desc: `Tổng: ${formatCurrencyShort(stats.totalRevenue || 0)}` },
          { title: 'Đánh giá TB', value: (stats.averageRating || 0).toFixed(1), icon: <Star size={18} />, desc: 'Trên 5 sao' },
        ].map((card, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md ${
              card.highlight ? 'border-[#D97706]/40 bg-[#FFFBEB]' : 'border-[#E5E7EB]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{card.title}</p>
                <h3 className="text-xl font-bold text-[#111827] mt-1">{card.value}</h3>
                <p className="text-[10px] text-[#6B7280] font-medium mt-0.5">{card.desc}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.highlight ? 'bg-[#D97706]/10 text-[#D97706]' : 'bg-[#F3F4F6] text-[#A65A3A]'}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-5">Doanh thu theo tháng</h2>
          {(charts.revenueByMonth || []).length > 0 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrencyShort(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#A65A3A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-[#6B7280] text-sm">Chưa có dữ liệu doanh thu</div>
          )}
        </div>

        {/* Booking by Status Pie */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-5">Booking theo trạng thái</h2>
          {(charts.bookingsByStatus || []).length > 0 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.bookingsByStatus.map((b: any) => ({ name: b.status, value: b.count }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                    {(charts.bookingsByStatus || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-[#6B7280] text-sm">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Recent + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-4">Booking mới</h2>
          <div className="space-y-2">
            {(recent.bookings || []).length > 0 ? recent.bookings.map((b: any) => (
              <div key={b._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{b.customerInfo?.fullName || b.touristId?.fullName || '—'}</p>
                  <p className="text-xs text-[#6B7280] truncate">{b.workshopId?.title || 'Workshop'}</p>
                </div>
                <StatusBadge status={b.bookingStatus} type="booking" />
              </div>
            )) : <p className="text-sm text-[#6B7280]">Chưa có booking nào</p>}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-4">Đơn hàng mới</h2>
          <div className="space-y-2">
            {(recent.orders || []).length > 0 ? recent.orders.map((o: any) => (
              <div key={o._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{o.orderCode}</p>
                  <p className="text-xs text-[#6B7280] truncate">{o.touristId?.fullName || '—'} · {formatCurrencyShort(o.totalAmount)}</p>
                </div>
                <StatusBadge status={o.orderStatus} type="order" />
              </div>
            )) : <p className="text-sm text-[#6B7280]">Chưa có đơn hàng nào</p>}
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
                <div className="w-8 h-8 rounded-lg bg-[#A65A3A]/10 flex items-center justify-center text-[#A65A3A] group-hover:bg-[#A65A3A]/20 transition-colors">
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

      {/* Workshops Need Timeslot + Reviews */}
      {((recent.workshopsNeedTimeslot || []).length > 0 || (recent.reviews || []).length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(recent.workshopsNeedTimeslot || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <h2 className="text-base font-bold text-[#111827] mb-4">Workshop cần thêm khung giờ</h2>
              <div className="space-y-2">
                {recent.workshopsNeedTimeslot.map((w: any) => (
                  <div key={w._id} className="flex items-center justify-between p-3 rounded-xl bg-[#FFFBEB] border border-[#D97706]/20">
                    <p className="text-sm font-semibold text-[#92400E] truncate">{w.title}</p>
                    <Link to="/host/timeslots" className="text-xs font-bold text-[#D97706] hover:underline shrink-0 ml-2">Thêm giờ</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(recent.reviews || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <h2 className="text-base font-bold text-[#111827] mb-4">Đánh giá mới</h2>
              <div className="space-y-2">
                {recent.reviews.map((r: any) => (
                  <div key={r._id} className="p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#111827]">{r.touristId?.fullName || '—'}</p>
                      <div className="flex items-center gap-0.5 text-[#D97706]">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                      </div>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5 truncate">{r.workshopId?.title} — {r.comment || 'Không có bình luận'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HostDashboardPage;
