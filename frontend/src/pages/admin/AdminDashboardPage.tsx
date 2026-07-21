import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, UserPlus, BookOpen, CalendarCheck, DollarSign,
  ShoppingBag, FileText, ArrowRight, TrendingUp, BarChart3, Eye,
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

const ROLE_LABELS: Record<string, string> = {
  TOURIST: 'Du khách',
  HOST: 'Chủ xưởng',
  TOUR_GUIDE: 'Hướng dẫn viên',
  ADMIN: 'Quản trị',
};

const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardApi.getAdminStats()
      .then((res) => setData(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải dữ liệu tổng quan quản trị..." />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4">
          <BarChart3 size={28} />
        </div>
        <h3 className="text-lg font-bold text-[#2F2722]">Không thể tải dữ liệu</h3>
        <p className="text-sm text-[#7A6A5E] mt-1">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  const { stats, charts, recent } = data;

  const statCards = [
    { title: 'Tổng người dùng', value: stats.totalUsers, icon: <Users size={20} />, desc: `${stats.totalTourists} du khách · ${stats.totalGuides} HDV` },
    { title: 'Chủ xưởng', value: stats.totalHosts, icon: <UserCheck size={20} />, desc: 'Nghệ nhân liên kết' },
    { title: 'Hồ sơ chờ duyệt', value: stats.pendingHostApplications, icon: <FileText size={20} />, desc: 'Đơn đăng ký Chủ xưởng', highlight: stats.pendingHostApplications > 0 },
    { title: 'Workshop hoạt động', value: stats.activeWorkshops, icon: <BookOpen size={20} />, desc: `${stats.totalWorkshops} tổng workshop` },
    { title: 'Booking đã TT', value: stats.paidBookings, icon: <CalendarCheck size={20} />, desc: `${stats.totalBookings} tổng booking` },
    { title: 'Doanh thu tháng này', value: formatCurrencyShort(stats.monthlyRevenue || 0), icon: <DollarSign size={20} />, desc: `Tổng: ${formatCurrencyShort(stats.totalRevenue || 0)}` },
  ];

  const quickActions = [
    { label: 'Duyệt Chủ xưởng', desc: 'Xét duyệt hồ sơ đăng ký', to: '/admin/approve-hosts', icon: <UserPlus size={18} /> },
    { label: 'Quản lý người dùng', desc: 'Danh sách tài khoản', to: '/admin/users', icon: <Users size={18} /> },
    { label: 'Xem doanh thu', desc: 'Thống kê tài chính', to: '/admin/revenue', icon: <TrendingUp size={18} /> },
  ];

  const userByRoleData = (charts.userByRole || []).map((u: any) => ({
    name: ROLE_LABELS[u.role] || u.role,
    value: u.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Tổng quan quản trị</h1>
        <p className="text-sm text-[#6B7280] mt-1">Theo dõi hoạt động toàn hệ thống CraftLocal.</p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
              card.highlight ? 'border-[#D97706]/40 bg-[#FFFBEB]' : 'border-[#E5E7EB]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold text-[#111827] tracking-tight">{card.value}</h3>
                <p className="text-[11px] text-[#6B7280] font-medium">{card.desc}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.highlight ? 'bg-[#D97706]/10 text-[#D97706]' : 'bg-[#F3F4F6] text-[#A65A3A]'}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-5">Doanh thu theo tháng</h2>
          {(charts.revenueByMonth || []).length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => formatCurrencyShort(v)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#A65A3A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#6B7280] text-sm">Chưa có dữ liệu doanh thu</div>
          )}
        </div>

        {/* User by Role Pie */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-5">Người dùng theo vai trò</h2>
          {userByRoleData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userByRoleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {userByRoleData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#6B7280] text-sm">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Booking + Order Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking by Status */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-5">Booking theo trạng thái</h2>
          {(charts.bookingByStatus || []).length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.bookingByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis dataKey="status" type="category" tick={{ fill: '#6B7280', fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[#6B7280] text-sm">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Order by Status */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-5">Đơn hàng theo trạng thái</h2>
          {(charts.orderByStatus || []).length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.orderByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis dataKey="status" type="category" tick={{ fill: '#6B7280', fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#16A34A" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[#6B7280] text-sm">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Recent Sections + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-4">Booking gần đây</h2>
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

        {/* Pending Host Applications */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111827]">Hồ sơ chờ duyệt</h2>
            {(recent.hostApplications || []).length > 0 && (
              <Link to="/admin/approve-hosts" className="text-xs font-bold text-[#A65A3A] hover:underline">Xem tất cả</Link>
            )}
          </div>
          <div className="space-y-2">
            {(recent.hostApplications || []).length > 0 ? recent.hostApplications.map((a: any) => (
              <div key={a._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{a.workshopName}</p>
                  <p className="text-xs text-[#6B7280] truncate">{a.fullName} · {a.email}</p>
                </div>
                <StatusBadge status={a.status} type="hostApplication" />
              </div>
            )) : <p className="text-sm text-[#6B7280]">Không có hồ sơ chờ duyệt</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#111827] mb-4">Thao tác nhanh</h2>
          <div className="space-y-2">
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
                  <p className="text-xs text-[#6B7280] truncate">{a.desc}</p>
                </div>
                <ArrowRight size={14} className="text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
