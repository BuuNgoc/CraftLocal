import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { tourGuideSchema, type TourGuideFormData } from '../../schemas/tourGuideSchema';
import tourGuideApi from '../../api/tourGuideApi';
import type { User } from '../../types/user.type';
import { Plus, UserPlus, Mail, Phone, Calendar } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

const ManageTourGuidesPage: React.FC = () => {
  const [guides, setGuides] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TourGuideFormData>({
    resolver: zodResolver(tourGuideSchema)
  });

  const fetchGuides = () => {
    tourGuideApi.getByHost()
      .then((res) => setGuides(res.data.data || []))
      .catch(() => setGuides([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGuides(); }, []);

  const onSubmit = async (data: TourGuideFormData) => {
    try {
      await tourGuideApi.create(data);
      setShowModal(false);
      reset();
      fetchGuides();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Tạo hướng dẫn viên thất bại');
    }
  };

  if (loading) return <Loading text="Đang tải danh sách hướng dẫn viên..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Quản lý Hướng dẫn viên" subtitle="Đăng ký tài khoản và phân công lịch trình check-in cho HĐV." />
        <Button size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 font-bold shadow-xs">
          <Plus size={16} /> Thêm Hướng dẫn viên
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E6DED5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6DED5] bg-[#FAF7F2]/50 text-[#7A6A5E]">
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Họ và tên</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Email</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Số điện thoại</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Trạng thái</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {guides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#7A6A5E] italic">
                    Chưa có hướng dẫn viên nào được đăng ký.
                  </td>
                </tr>
              ) : (
                guides.map((g) => (
                  <tr key={g._id} className="border-b border-[#E6DED5]/50 hover:bg-[#FAF7F2]/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#A65A3A]/10 flex items-center justify-center font-bold text-[#A65A3A] text-sm">
                          {g.fullName[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-[#2F2722]">{g.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#7A6A5E] font-medium">{g.email}</td>
                    <td className="p-4 text-[#7A6A5E] font-medium">{g.phone}</td>
                    <td className="p-4">
                      <StatusBadge status={g.status} type="user" />
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        to={`/host/assign-guide?guideId=${g._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#A65A3A] border border-[#E6DED5] rounded-xl hover:bg-[#FAF7F2] transition-colors"
                        title="Xem phân công công việc"
                      >
                        <Calendar size={13} />
                        Lịch trình
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo Hướng dẫn viên mới">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Họ và tên" placeholder="Nguyễn Văn B" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Địa chỉ Email" type="email" placeholder="example@gmail.com" error={errors.email?.message} {...register('email')} />
          <Input label="Số điện thoại" placeholder="0909xxxxxx" error={errors.phone?.message} {...register('phone')} />
          <Input label="Mật khẩu tài khoản" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          
          <div className="pt-2">
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Đăng ký tài khoản
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageTourGuidesPage;
