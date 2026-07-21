import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workshopSchema, type WorkshopFormData } from '../../schemas/workshopSchema';
import workshopApi from '../../api/workshopApi';
import categoryApi from '../../api/categoryApi';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import SectionCard from '../../components/common/SectionCard';
import PageHeader from '../../components/common/PageHeader';
import ImageUploader from '../../components/common/ImageUploader';
import { ImagePlus, Info, MapPin, Calendar, HelpCircle, Sparkles, CheckCircle, ArrowLeft, Wand2 } from 'lucide-react';
import AIDescriptionModal from '../../components/ai/AIDescriptionModal';


const WorkshopFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Success modal flow for creation
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdWorkshopId, setCreatedWorkshopId] = useState<string>('');
  const [showAIModal, setShowAIModal] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
  });


  useEffect(() => {
    categoryApi.getAll()
      .then((res) => {
        const cats = res.data.data || [];
        // Support categories that are type WORKSHOP or BOTH
        const wsCats = cats.filter((c: any) => c.type === 'WORKSHOP' || c.type === 'BOTH');
        setCategories(wsCats.map((c: any) => ({ value: c._id || c.name, label: c.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      workshopApi.getById(id)
        .then((res) => {
          const ws = res.data.data;
          reset({
            title: ws.title,
            description: ws.description,
            category: ws.categoryId?._id || ws.categoryId || ws.category || '',
            price: ws.price,
            duration: ws.duration,
            maxGuestsPerSlot: ws.maxGuestsPerSlot || 12,
            address: ws.address?.fullAddress || ws.address || '',
            location: ws.locationLabel || ws.location || '',
          });
          if (ws.images?.length > 0) setUploadedImages(ws.images);
        })
        .catch(() => setErrorMsg('Không tìm thấy workshop'))
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data: WorkshopFormData) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const finalImages = uploadedImages.length > 0
        ? uploadedImages
        : ['/images/workshop-pottery-thanh-ha-01.jpg'];

      const body = {
        title: data.title,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        duration: Number(data.duration),
        maxGuestsPerSlot: Number(data.maxGuestsPerSlot || 12),
        address: data.address,
        location: data.location,
        images: finalImages,
      };

      if (isEdit && id) {
        await workshopApi.update(id, body);
        setSuccessMsg('Cập nhật workshop thành công!');
        setTimeout(() => navigate('/host/workshops'), 1200);
      } else {
        const res = await workshopApi.create(body);
        const newWorkshop = res.data.data;
        setCreatedWorkshopId(newWorkshop._id);
        setSuccessMsg('Tạo workshop thành công!');
        setTimeout(() => setShowSuccessModal(true), 1200);
      }
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.errors && Array.isArray(errData.errors)) {
        setErrorMsg(errData.errors.map((e: any) => e.message).join('. '));
      } else {
        setErrorMsg(errData?.message || 'Lưu workshop thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    }
  };

  if (initialLoading) return <Loading text="Đang tải dữ liệu..." />;

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <PageHeader
          title={isEdit ? 'Chỉnh sửa Workshop' : 'Tạo Workshop mới'}
          subtitle="Cung cấp thông tin chi tiết về trải nghiệm truyền thống cho du khách."
        />
        <button
          type="button"
          onClick={() => navigate('/host/workshops')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#7A6A5E] hover:text-[#A65A3A] transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}
        
        {/* Section 1: Basic Info */}
        <SectionCard
          title="1. Thông tin cơ bản"
          description="Cung cấp tiêu đề, danh mục và mô tả chi tiết của buổi trải nghiệm."
          icon={<Sparkles size={16} />}
        >
          <div className="space-y-4">
            <Input label="Tiêu đề trải nghiệm *" placeholder="Ví dụ: Làm gốm xoay Thanh Hà Hội An" error={errors.title?.message} {...register('title')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Danh mục *" options={categories} placeholder="Chọn danh mục" error={errors.category?.message} {...register('category')} />
            </div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider">Mô tả chi tiết *</label>
              <button
                type="button"
                onClick={() => setShowAIModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition shadow-sm"
              >
                <Wand2 size={13} /> AI viết mô tả
              </button>
            </div>
            <Textarea placeholder="Mô tả chi tiết lịch trình, văn hóa của trải nghiệm..." rows={5} error={errors.description?.message} {...register('description')} />
          </div>
        </SectionCard>

        {/* Section 2: Địa điểm */}
        <SectionCard
          title="2. Địa điểm trải nghiệm"
          description="Xác định khu vực làng nghề và địa chỉ cụ thể để du khách tìm đến."
          icon={<MapPin size={16} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Khu vực (Tên làng nghề/Thành phố) *" placeholder="Ví dụ: Hội An, Bát Tràng..." error={errors.location?.message} {...register('location')} />
            <Input label="Địa chỉ chi tiết *" placeholder="Số nhà, tên đường, thôn/xóm..." error={errors.address?.message} {...register('address')} />
          </div>
        </SectionCard>

        {/* Section 3: Details info */}
        <SectionCard
          title="3. Thông tin trải nghiệm"
          description="Thiết lập đơn giá vé, thời lượng buổi học và giới hạn số lượng du khách tối đa."
          icon={<HelpCircle size={16} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Giá vé khách (VND) *" type="number" placeholder="450000" error={errors.price?.message} {...register('price')} />
            <Input label="Thời lượng (phút) *" type="number" placeholder="180" error={errors.duration?.message} {...register('duration')} />
            <Input label="Số khách tối đa / lượt" type="number" placeholder="12" error={errors.maxGuestsPerSlot?.message} {...register('maxGuestsPerSlot')} />
          </div>
        </SectionCard>

        {/* Section 4: Images */}
        <SectionCard
          title="4. Hình ảnh trải nghiệm"
          description="Tải lên tối thiểu một bức ảnh thực tế sắc nét mô tả hoạt động."
          icon={<ImagePlus size={16} />}
        >
          <ImageUploader
            images={uploadedImages}
            onChange={setUploadedImages}
            maxImages={5}
            folder="workshops"
          />
          <p className="text-[10px] text-gray-400 font-semibold mt-1">Ảnh đầu tiên sẽ được dùng làm ảnh đại diện (thumbnail). Nếu không upload sẽ dùng ảnh mặc định.</p>
        </SectionCard>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" size="md" isLoading={isSubmitting} className="shadow-2xs">
            {isSubmitting ? 'Đang xử lý...' : isEdit ? 'Cập nhật thay đổi' : 'Tạo Workshop mới'}
          </Button>
          <Button type="button" variant="outline" size="md" onClick={() => navigate('/host/workshops')}>
            Hủy bỏ
          </Button>
        </div>
      </form>

      {/* Success Dialog Modal asking to create timeslots */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => { setShowSuccessModal(false); navigate('/host/workshops'); }}
        title="Tạo Workshop thành công!"
        size="sm"
      >
        <div className="space-y-4 py-2 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-[#16A34A] border border-green-200 mx-auto">
            <Calendar size={22} />
          </div>
          <p className="text-gray-500 text-xs font-semibold leading-relaxed">
            Workshop đã được tạo thành công trên hệ thống. Để du khách có thể bắt đầu đăng ký đặt chỗ, bạn cần tạo thêm các <strong>khung giờ (timeslots)</strong> hoạt động.
          </p>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Bạn có muốn thiết lập khung giờ cho workshop này ngay bây giờ không?
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/host/timeslots?workshopId=${createdWorkshopId}`);
              }}
              fullWidth
              size="sm"
            >
              Thêm khung giờ ngay
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/host/workshops');
              }}
              variant="outline"
              fullWidth
              size="sm"
            >
              Để sau
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Description Modal */}
      <AIDescriptionModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        type="WORKSHOP"
        title={watch('title') || ''}
        category={categories.find(c => c.value === watch('category'))?.label}
        location={watch('location')}
        onApply={(data) => {
          if (data.description) setValue('description', data.description);
        }}
      />
    </div>
  );
};

export default WorkshopFormPage;
