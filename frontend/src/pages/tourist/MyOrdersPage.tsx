import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Calendar, Package } from 'lucide-react';
import orderApi from '../../api/orderApi';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import EmptyState from '../../components/common/EmptyState';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getMyOrders()
      .then((res) => setOrders(res.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải danh sách đơn hàng thủ công..." />;

  if (orders.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-12">
        <EmptyState
          title="Chưa có đơn hàng"
          description="Bạn chưa mua sản phẩm thủ công nào từ các nghệ nhân. Hãy ghé thăm cửa hàng của chúng tôi!"
          icon={<ShoppingBag size={48} className="text-[#A65A3A] opacity-60" />}
          action={
            <Link to="/products">
              <Button>Mua sắm sản phẩm</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-10 min-h-screen space-y-6">
      <PageHeader
        title="Đơn hàng của tôi"
        subtitle="Theo dõi quá trình giao nhận hàng thủ công mỹ nghệ từ các xưởng nghề truyền thống."
      />

      <div className="space-y-4">
        {orders.map((o) => (
          <div
            key={o._id}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5 md:p-6 shadow-xs relative overflow-hidden"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB] mb-4">
              <div className="space-y-1">
                <p className="font-bold text-gray-900 text-sm sm:text-base">
                  Đơn hàng #{o.orderCode || o._id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#A65A3A]" />
                  {formatDate(o.createdAt)}
                </p>
              </div>
              <StatusBadge status={o.orderStatus} type="order" />
            </div>

            {/* Items list */}
            <div className="space-y-3 pb-4">
              {(o.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 shrink-0">
                      <Package size={14} />
                    </div>
                    <span className="text-gray-900 font-bold truncate">
                      {item.productId?.name || 'Sản phẩm mỹ nghệ'}
                    </span>
                    <span className="text-gray-400 font-semibold">× {item.quantity}</span>
                  </div>
                  <span className="shrink-0 text-gray-500 font-extrabold">
                    {formatCurrencyShort(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer total */}
            <div className="border-t border-[#E5E7EB] pt-4 flex items-center justify-between font-bold text-sm sm:text-base">
              <span className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold">Tổng thanh toán</span>
              <span className="text-[#A65A3A] text-base sm:text-lg font-extrabold">
                {formatCurrencyShort(o.totalAmount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrdersPage;
