import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Tag, Box } from 'lucide-react';
import productApi from '../../api/productApi';
import type { Product } from '../../types/product.type';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';

import ImageWithFallback from '../../components/common/ImageWithFallback';

const ManageProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirm delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const fetchProducts = () => {
    productApi.getByHost()
      .then((res) => setProducts(res.data.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const triggerDelete = (id: string) => {
    setSelectedProductId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductId) return;
    try {
      setLoading(true);
      await productApi.delete(selectedProductId);
      setDeleteOpen(false);
      setSelectedProductId(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Đang tải danh sách sản phẩm..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Quản lý sản phẩm" subtitle="Đăng tải và quản lý kho hàng thủ công mỹ nghệ của xưởng." />
        <Link to="/host/products/create">
          <Button size="sm" className="flex items-center gap-1.5 font-bold shadow-xs">
            <Plus size={16} /> Thêm sản phẩm mới
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-[#E6DED5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6DED5] bg-[#FAF7F2]/50 text-[#7A6A5E]">
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Sản phẩm</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Chất liệu</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Đơn giá</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Tồn kho</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Trạng thái</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#7A6A5E] italic">
                    Chưa có sản phẩm nào được đăng bán.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="border-b border-[#E6DED5]/50 hover:bg-[#FAF7F2]/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={p.images?.[0] || p.thumbnail || ''}
                          fallbackSrc="/images/fallback-product.jpg"
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#E6DED5]/60"
                        />
                        <span className="font-bold text-[#2F2722]">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#7A6A5E] font-medium">{p.material || 'Thủ công'}</td>
                    <td className="p-4 font-extrabold text-[#A65A3A]">{formatCurrencyShort(p.price)}</td>
                    <td className="p-4 font-bold text-[#2F2722]">{p.stock}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        p.stock > 0 ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-red-50 text-red-700 border border-red-150'
                      }`}>
                        {p.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        <Link
                          to={`/host/products/${p._id}/edit`}
                          className="p-2 text-[#7A6A5E] hover:text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => triggerDelete(p._id)}
                          className="p-2 text-[#DC2626]/80 hover:text-[#DC2626] hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedProductId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa sản phẩm"
        description="Sản phẩm này sẽ bị xóa khỏi cửa hàng vĩnh viễn và không thể hoàn tác. Khách hàng không thể xem hay mua sản phẩm này nữa."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        type="danger"
      />
    </div>
  );
};

export default ManageProductsPage;
