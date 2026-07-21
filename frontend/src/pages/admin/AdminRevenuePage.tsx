import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dashboardApi from '../../api/dashboardApi';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import Loading from '../../components/common/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { DollarSign, CalendarCheck } from 'lucide-react';

const AdminRevenuePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getAdminStats()
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải báo cáo doanh thu..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Thống kê doanh thu" subtitle="Phân tích tăng trưởng doanh số bán sản phẩm và đặt chỗ trải nghiệm." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard
          title="Tổng doanh thu hệ thống"
          value={formatCurrencyShort(data?.totalRevenue || 0)}
          icon={<DollarSign size={20} />}
          trend={{ value: 12, isPositive: true }}
          description="Từ thanh toán và mua hàng thành công"
        />
        <StatCard
          title="Tổng lượt đặt vé"
          value={data?.totalBookings || 0}
          icon={<CalendarCheck size={20} />}
          trend={{ value: 4.8, isPositive: true }}
          description="Đơn đặt trải nghiệm văn hóa thành công"
        />
      </div>

      <div className="bg-white rounded-3xl border border-[#E6DED5] p-6 shadow-sm">
        <h2 className="font-headline-md text-base font-bold text-[#2F2722] mb-5">Biểu đồ doanh thu hàng tháng</h2>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.monthlyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FAF7F2" />
              <XAxis dataKey="month" tick={{ fill: '#7A6A5E', fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fill: '#7A6A5E', fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrencyShort(v)} contentStyle={{ borderRadius: '16px', border: '1px solid #E6DED5', backgroundColor: '#fff' }} />
              <Bar dataKey="revenue" fill="#A65A3A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenuePage;
