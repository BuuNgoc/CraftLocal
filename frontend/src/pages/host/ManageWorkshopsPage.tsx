import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, EyeOff, Trash2, Calendar, AlertTriangle, Eye } from 'lucide-react';
import workshopApi from '../../api/workshopApi';
import type { Workshop } from '../../types/workshop.type';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';

import ImageWithFallback from '../../components/common/ImageWithFallback';

const ManageWorkshopsPage: React.FC = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

  const fetchWorkshops = () => {
    workshopApi.getByHost()
      .then((res) => setWorkshops(res.data.data || []))
      .catch(() => setWorkshops([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWorkshops(); }, []);

  const triggerDelete = (id: string) => {
    setSelectedWorkshopId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWorkshopId) return;
    try {
      setLoading(true);
      await workshopApi.delete(selectedWorkshopId);
      setConfirmOpen(false);
      setSelectedWorkshopId(null);
      fetchWorkshops();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (ws: Workshop) => {
    try {
      const nextStatus = ws.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await workshopApi.update(ws._id, { ...ws, status: nextStatus });
      fetchWorkshops();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loading text="Đang tải danh sách workshop của bạn..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-[#2F2722]">Quản lý Workshop</h1>
          <p className="text-[#7A6A5E] text-xs mt-0.5">Tạo và thiết lập lịch hoạt động cho các trải nghiệm văn hóa.</p>
        </div>
        <Link to="/host/workshops/create">
          <Button size="sm" className="flex items-center gap-1.5 font-bold shadow-xs">
            <Plus size={16} /> Thêm Workshop mới
          </Button>
        </Link>
      </div>

      {workshops.length === 0 ? (
        <EmptyState
          title="Chưa có workshop nào"
          description="Bắt đầu chia sẻ nét đẹp văn hóa địa phương bằng cách tạo workshop trải nghiệm đầu tiên của bạn!"
          action={
            <Link to="/host/workshops/create">
              <Button size="sm">Tạo ngay</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {workshops.map((ws) => (
            <div
              key={ws._id}
              className="bg-white rounded-3xl border border-[#E6DED5] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="h-44 relative bg-gray-100 overflow-hidden">
                <ImageWithFallback
                  src={ws.images?.[0] || ws.thumbnail || ''}
                  fallbackSrc="/images/fallback-workshop.jpg"
                  alt={ws.title}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={ws.status} type="timeslot" />
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="font-headline-md font-bold text-[#2F2722] text-base line-clamp-1">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-[#7A6A5E] font-medium line-clamp-2">
                    {ws.description}
                  </p>
                </div>

                <div className="border-t border-[#E6DED5]/50 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#7A6A5E] block uppercase font-bold tracking-wider">Đơn giá vé</span>
                    <span className="text-[#A65A3A] font-extrabold text-base">{formatCurrencyShort(ws.price)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#7A6A5E] block uppercase font-bold tracking-wider">Thời lượng</span>
                    <span className="text-[#2F2722] font-bold text-sm">{ws.duration} phút</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    to={`/host/workshops/${ws._id}/edit`}
                    className="flex-1 min-w-[70px] flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-[#2F2722] border border-[#E6DED5] rounded-xl hover:bg-[#FAF7F2] transition-colors"
                  >
                    <Edit size={12} /> Sửa
                  </Link>
                  <Link
                    to={`/host/timeslots?workshopId=${ws._id}`}
                    className="flex-1 min-w-[90px] flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-[#A65A3A] hover:bg-[#8e492b] rounded-xl transition-all shadow-xs"
                  >
                    <Calendar size={12} /> Khung giờ
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(ws)}
                    className="p-2 text-xs font-bold text-[#7A6A5E] border border-[#E6DED5] rounded-xl hover:bg-[#FAF7F2] transition-colors"
                    title={ws.status === 'ACTIVE' ? 'Ẩn workshop' : 'Hiện workshop'}
                  >
                    {ws.status === 'ACTIVE' ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => triggerDelete(ws._id)}
                    className="p-2 text-xs font-bold text-[#DC2626] border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation delete modal */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setSelectedWorkshopId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa Workshop"
        description="Hành động này sẽ xóa workshop vĩnh viễn và không thể hoàn tác. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        type="danger"
      />
    </div>
  );
};

export default ManageWorkshopsPage;
