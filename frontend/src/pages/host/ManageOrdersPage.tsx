import React, { useEffect, useState } from 'react';
import orderApi from '../../api/orderApi';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Calendar, User, Package, DollarSign } from 'lucide-react';

const ManageOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    orderApi.getHostOrders()
      .then((res) => setOrders(res.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await orderApi.updateStatus(id, status);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: status } : o));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  if (loading) return <Loading text="Đang tải danh sách đơn hàng..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý đơn hàng" subtitle="Theo dõi trạng thái đóng gói và giao nhận sản phẩm thủ công." />

      {orders.length === 0 ? (
        <EmptyState title="Chưa có đơn hàng" description="Chưa có đơn hàng nào cần xử lý từ người mua." />
      ) : (
        <div className="space-y-5">
          {orders.map((o) => (
            <div
              key={o._id}
              className="bg-white rounded-3xl border border-[#E6DED5] p-5 md:p-6 shadow-xs relative overflow-hidden"
            >
              {/* Left accent border */}
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#FAF7F2]" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6DED5]/60 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2F2722] text-sm sm:text-base">
                      Đơn hàng #{o.orderCode || o._id.slice(-8).toUpperCase()}
                    </span>
                    <StatusBadge status={o.orderStatus} type="order" />
                  </div>
                  <p className="text-xs text-[#7A6A5E] font-medium flex items-center gap-1.5 flex-wrap">
                    <User size={13} className="text-[#A65A3A]" />
                    <strong className="text-[#2F2722]">{o.touristId?.fullName || 'Khách vãng lai'}</strong>
                    <span className="text-[#E6DED5]">|</span>
                    <Calendar size={13} className="text-[#A65A3A]" />
                    <span>{formatDate(o.createdAt)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#7A6A5E] uppercase tracking-wide">Trạng thái:</span>
                  <select
                    value={o.orderStatus}
                    onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    className="px-3 py-1.5 border border-[#E6DED5] rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#2F2722] focus:outline-none focus:border-[#A65A3A] cursor-pointer"
                  >
                    {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 pb-4">
                {(o.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 bg-[#FAF7F2] rounded-lg border border-[#E6DED5]/40 text-[#7A6A5E] shrink-0">
                        <Package size={13} />
                      </div>
                      <span className="text-[#2F2722] font-semibold truncate">
                        {item.productId?.name || 'Sản phẩm'}
                      </span>
                      <span className="text-xs text-[#7A6A5E] font-medium">× {item.quantity}</span>
                    </div>
                    <span className="text-xs text-[#7A6A5E] font-bold">
                      {formatCurrencyShort(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order total amount */}
              <div className="border-t border-[#E6DED5]/60 pt-4 flex items-center justify-between font-bold text-sm sm:text-base">
                <span className="text-xs text-[#7A6A5E] uppercase tracking-wider font-bold">Tổng số tiền thu</span>
                <span className="text-[#A65A3A] text-base font-extrabold flex items-center gap-0.5">
                  {formatCurrencyShort(o.totalAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageOrdersPage;
