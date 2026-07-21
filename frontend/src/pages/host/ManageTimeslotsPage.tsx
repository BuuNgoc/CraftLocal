import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import tourGuideApi from '../../api/tourGuideApi';
import workshopApi from '../../api/workshopApi';
import type { Timeslot } from '../../types/timeslot.type';
import type { Workshop } from '../../types/workshop.type';
import type { User } from '../../types/user.type';
import { TIMESLOT_STATUS_LABELS } from '../../utils/constants';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Plus, Edit2, Trash2, Users, Calendar, Clock, Sparkles } from 'lucide-react';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const toLocalDatetimeString = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const tzoffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
};

const ManageTimeslotsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [guides, setGuides] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState<Timeslot | null>(null);

  // Confirm delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Success assign guide prompt modal
  const [showAssignPrompt, setShowAssignPrompt] = useState(false);
  const [newTimeslotInfo, setNewTimeslotInfo] = useState<{ id: string; workshopId: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    workshopId: '',
    startTime: '',
    endTime: '',
    totalSlots: 10,
    price: 0,
    tourGuideId: '',
    note: '',
  });

  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    totalSlots: 10,
    price: 0,
    tourGuideId: '',
    status: 'AVAILABLE' as any,
    note: '',
  });

  const fetchData = async () => {
    try {
      const [tsRes, wsRes, gRes] = await Promise.all([
        tourGuideApi.getHostTimeslots(),
        workshopApi.getByHost(),
        tourGuideApi.getByHost(),
      ]);
      const tsData = tsRes.data.data || [];
      const wsData = wsRes.data.data || [];
      const gData = gRes.data.data || [];

      setTimeslots(tsData);
      setWorkshops(wsData);
      setGuides(gData);

      // Check workshopId query param to auto-fill and open modal
      const params = new URLSearchParams(window.location.search);
      const queryWsId = params.get('workshopId');
      if (queryWsId) {
        const selectedWs = wsData.find((w: any) => w._id === queryWsId);
        setFormData(prev => ({
          ...prev,
          workshopId: queryWsId,
          price: selectedWs ? selectedWs.price : 0,
        }));
        setShowAddModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWorkshopChange = (wsId: string) => {
    const selectedWs = workshops.find(w => w._id === wsId);
    setFormData(prev => ({
      ...prev,
      workshopId: wsId,
      price: selectedWs ? selectedWs.price : 0,
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workshopId || !formData.startTime || !formData.endTime) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }
    try {
      setLoading(true);
      const res = await tourGuideApi.createTimeslot({
        workshopId: formData.workshopId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        totalSlots: Number(formData.totalSlots),
        price: Number(formData.price),
        tourGuideId: formData.tourGuideId || undefined,
        note: formData.note,
      });

      const newTs = res.data.data;
      
      setShowAddModal(false);
      setFormData({
        workshopId: '',
        startTime: '',
        endTime: '',
        totalSlots: 10,
        price: 0,
        tourGuideId: '',
        note: '',
      });
      await fetchData();

      // Trigger assign guide prompt modal
      setNewTimeslotInfo({ id: newTs._id, workshopId: newTs.workshopId?._id || newTs.workshopId });
      setShowAssignPrompt(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Tạo khung giờ thất bại');
      setLoading(false);
    }
  };

  const handleEditClick = (ts: Timeslot) => {
    setSelectedTimeslot(ts);
    setEditFormData({
      startTime: toLocalDatetimeString(ts.startTime),
      endTime: toLocalDatetimeString(ts.endTime),
      totalSlots: ts.totalSlots,
      price: ts.price,
      tourGuideId: ts.tourGuideId?._id || ts.tourGuideId || '',
      status: ts.status,
      note: ts.note || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimeslot) return;
    try {
      setLoading(true);
      await tourGuideApi.updateTimeslot(selectedTimeslot._id, {
        startTime: new Date(editFormData.startTime).toISOString(),
        endTime: new Date(editFormData.endTime).toISOString(),
        totalSlots: Number(editFormData.totalSlots),
        price: Number(editFormData.price),
        tourGuideId: editFormData.tourGuideId || undefined,
        status: editFormData.status,
        note: editFormData.note,
      });
      setShowEditModal(false);
      setSelectedTimeslot(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật khung giờ thất bại');
      setLoading(false);
    }
  };

  const triggerDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setLoading(true);
      await tourGuideApi.deleteTimeslot(deletingId);
      setDeleteOpen(false);
      setDeletingId(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xóa khung giờ thất bại');
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Đang tải dữ liệu khung giờ..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Quản lý khung giờ" subtitle="Thiết lập thời gian trải nghiệm và phân công người hướng dẫn." />
        <Button size="sm" onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 font-bold shadow-xs">
          <Plus size={16} /> Thêm khung giờ mới
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E6DED5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6DED5] bg-[#FAF7F2]/50 text-[#7A6A5E]">
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Workshop</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Thời gian bắt đầu</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Thời gian kết thúc</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Số chỗ ngồi</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Đơn giá vé</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Hướng dẫn viên</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Trạng thái</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {timeslots.map((ts) => (
                <tr key={ts._id} className="border-b border-[#E6DED5]/50 hover:bg-[#FAF7F2]/20 transition-colors">
                  <td className="p-4 font-bold text-[#2F2722]">{ts.workshopId?.title || 'Workshop'}</td>
                  <td className="p-4 text-[#7A6A5E] font-medium">{new Date(ts.startTime).toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-[#7A6A5E] font-medium">{new Date(ts.endTime).toLocaleString('vi-VN')}</td>
                  <td className="p-4 font-bold text-[#2F2722]">{ts.bookedSlots}/{ts.totalSlots}</td>
                  <td className="p-4 font-extrabold text-[#A65A3A]">{formatCurrencyShort(ts.price)}</td>
                  <td className="p-4">
                    {ts.tourGuideId?.fullName ? (
                      <span className="font-bold text-[#2F2722]">{ts.tourGuideId.fullName}</span>
                    ) : (
                      <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Chưa gán</span>
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={ts.status} type="timeslot" />
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-1">
                      <Link
                        to={`/host/assign-guide?workshopId=${ts.workshopId?._id}&timeslotId=${ts._id}`}
                        className="p-2 text-[#7A6A5E] hover:text-[#A65A3A] hover:bg-[#FAF7F2] rounded-xl transition-all"
                        title="Gán Hướng dẫn viên"
                      >
                        <Users size={16} />
                      </Link>
                      <button
                        onClick={() => handleEditClick(ts)}
                        className="p-2 text-[#7A6A5E] hover:text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl transition-all"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => triggerDelete(ts._id)}
                        className="p-2 text-[#DC2626]/80 hover:text-[#DC2626] hover:bg-red-50 rounded-xl transition-all"
                        title="Xóa/Hủy"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TIMESLOT MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm khung giờ mới">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Workshop *</label>
            <select
              value={formData.workshopId}
              onChange={(e) => handleWorkshopChange(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm bg-white font-semibold text-[#2F2722]"
              required
            >
              <option value="">Chọn Workshop</option>
              {workshops.map(w => (
                <option key={w._id} value={w._id}>{w.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Thời gian kết thúc *</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Tổng số chỗ ngồi *</label>
              <input
                type="number"
                min="1"
                value={formData.totalSlots}
                onChange={(e) => setFormData(prev => ({ ...prev, totalSlots: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Giá vé (VND) *</label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Hướng dẫn viên phụ trách</label>
            <select
              value={formData.tourGuideId}
              onChange={(e) => setFormData(prev => ({ ...prev, tourGuideId: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm bg-white font-semibold text-[#2F2722]"
            >
              <option value="">Chọn Hướng dẫn viên (Chưa gán)</option>
              {guides.map(g => (
                <option key={g._id} value={g._id}>{g.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Ghi chú thêm</label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Ghi chú thiết lập riêng nếu có..."
              className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth>
              Tạo khung giờ hoạt động
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TIMESLOT MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa khung giờ">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                value={editFormData.startTime}
                onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Thời gian kết thúc *</label>
              <input
                type="datetime-local"
                value={editFormData.endTime}
                onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Tổng số chỗ ngồi *</label>
              <input
                type="number"
                min="1"
                value={editFormData.totalSlots}
                onChange={(e) => setEditFormData(prev => ({ ...prev, totalSlots: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Giá vé (VND) *</label>
              <input
                type="number"
                min="0"
                value={editFormData.price}
                onChange={(e) => setEditFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Hướng dẫn viên phụ trách</label>
            <select
              value={editFormData.tourGuideId}
              onChange={(e) => setEditFormData(prev => ({ ...prev, tourGuideId: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm bg-white font-semibold text-[#2F2722]"
            >
              <option value="">Chọn Hướng dẫn viên (Chưa gán)</option>
              {guides.map(g => (
                <option key={g._id} value={g._id}>{g.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Trạng thái khung giờ *</label>
            <select
              value={editFormData.status}
              onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm bg-white font-semibold text-[#2F2722]"
              required
            >
              <option value="AVAILABLE">Còn chỗ (AVAILABLE)</option>
              <option value="FULL">Đầy chỗ (FULL)</option>
              <option value="ONGOING">Đang diễn ra (ONGOING)</option>
              <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1.5 text-[#2F2722] uppercase tracking-wide">Ghi chú thêm</label>
            <textarea
              rows={2}
              value={editFormData.note}
              onChange={(e) => setEditFormData(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-[#E6DED5] rounded-xl focus:outline-none focus:border-[#A65A3A] text-sm font-semibold text-[#2F2722]"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth>
              Cập nhật thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận hủy khung giờ"
        description="Khung giờ này sẽ bị hủy bỏ hoặc xóa vĩnh viễn khỏi danh sách hoạt động. Khách đặt vé có thể bị ảnh hưởng. Bạn vẫn muốn tiếp tục?"
        confirmText="Xác nhận hủy"
        cancelText="Quay lại"
        type="warning"
      />

      {/* Assign guide prompt modal */}
      <Modal
        isOpen={showAssignPrompt}
        onClose={() => setShowAssignPrompt(false)}
        title="Khung giờ đã được tạo!"
      >
        <div className="space-y-4 py-2 text-center">
          <div className="w-12 h-12 bg-[#A65A3A]/10 rounded-full flex items-center justify-center text-[#A65A3A] mx-auto mb-2 border border-[#A65A3A]/25">
            <Users size={22} />
          </div>
          <p className="text-[#7A6A5E] text-sm leading-relaxed">
            Bạn đã tạo khung giờ thành công. Để quản lý hoạt động tốt hơn, bạn có muốn <strong>phân công hướng dẫn viên (tour guide)</strong> phụ trách khung giờ này ngay không?
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                setShowAssignPrompt(false);
                if (newTimeslotInfo) {
                  navigate(`/host/assign-guide?workshopId=${newTimeslotInfo.workshopId}&timeslotId=${newTimeslotInfo.id}`);
                }
              }}
              fullWidth
              size="sm"
            >
              Phân công ngay
            </Button>
            <Button
              onClick={() => setShowAssignPrompt(false)}
              variant="outline"
              fullWidth
              size="sm"
            >
              Để sau
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageTimeslotsPage;
