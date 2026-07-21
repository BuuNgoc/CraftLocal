import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '../../schemas/productSchema';
import productApi from '../../api/productApi';
import categoryApi from '../../api/categoryApi';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import PageHeader from '../../components/common/PageHeader';
import ImageUploader from '../../components/common/ImageUploader';
import { Package, HelpCircle, ImagePlus, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';


const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      material: '',
      origin: '',
      shortDescription: '',
    },
  });


  // Load categories for products
  useEffect(() => {
    categoryApi.getAll()
      .then((res) => {
        const cats = res.data.data || [];
        const productCats = cats.filter((c: any) => c.type === 'PRODUCT' || c.type === 'BOTH');
        setCategories(productCats.map((c: any) => ({ value: c._id, label: c.name })));
      })
      .catch(() => {});
  }, []);

  // Load existing product for edit
  useEffect(() => {
    if (isEdit && id) {
      productApi.getById(id)
        .then((res) => {
          const p = res.data.data;
          reset({
            name: p.name,
            description: p.description || '',
            categoryId: p.categoryId?._id || p.categoryId || '',
            price: p.price,
            stock: p.stock,
            material: p.material || '',
            origin: p.origin || '',
            shortDescription: p.shortDescription || '',
          });
          if (p.images?.length > 0) setUploadedImages(p.images);
        })
        .catch(() => setErrorMsg('Không tìm thấy sản phẩm'))
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data: ProductFormData) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const finalImages = uploadedImages.length > 0
        ? uploadedImages
        : ['/images/fallback-product.jpg'];

      const body = {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription || '',
        categoryId: data.categoryId,
        price: Number(data.price),
        stock: Number(data.stock),
        material: data.material || '',
        origin: data.origin || '',
        images: finalImages,
        thumbnail: finalImages[0],
        status: 'ACTIVE',
      };

      if (isEdit && id) {
        await productApi.update(id, body);
        setSuccessMsg('Cập nhật sản phẩm thành công!');
      } else {
        await productApi.create(body);
        setSuccessMsg('Tạo sản phẩm thành công!');
      }
      setTimeout(() => navigate('/host/products'), 1200);
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.errors && Array.isArray(errData.errors)) {
        setErrorMsg(errData.errors.map((e: any) => e.message).join('. '));
      } else {
        setErrorMsg(errData?.message || 'Lưu sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    }
  };

  if (initialLoading) return <Loading text="Đang tải dữ liệu sản phẩm..." />;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-8 flex items-center justify-between">
        <PageHeader
          title={isEdit ? 'Chỉnh sửa sản phẩm' : 'Đăng bán sản phẩm mới'}
          subtitle="Cập nhật chi tiết mặt hàng thủ công để giới thiệu tới khách du lịch."
        />
        <button
          onClick={() => navigate('/host/products')}
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

        {/* Basic Info */}
        <div className="bg-white rounded-3xl border border-[#E6DED5] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#2F2722] pb-2 border-b border-[#E6DED5]/60 flex items-center gap-2">
            <Package size={16} className="text-[#A65A3A]" /> 1. Thông tin mặt hàng
          </h2>
          <div className="space-y-4">
            <Input label="Tên sản phẩm thủ công *" placeholder="Ví dụ: Tách trà gốm men lam cổ..." error={errors.name?.message} {...register('name')} />
            <Textarea label="Mô tả sản phẩm *" placeholder="Mô tả chất liệu, quy trình chế tác và kích thước..." rows={4} error={errors.description?.message} {...register('description')} />
            <Input label="Mô tả ngắn" placeholder="Mô tả ngắn gọn sản phẩm (hiển thị ở danh sách)" {...register('shortDescription')} />
          </div>
        </div>

        {/* Pricing / Category */}
        <div className="bg-white rounded-3xl border border-[#E6DED5] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#2F2722] pb-2 border-b border-[#E6DED5]/60 flex items-center gap-2">
            <HelpCircle size={16} className="text-[#A65A3A]" /> 2. Giá cả & Kho hàng
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Đơn giá (VND) *" type="number" placeholder="250000" error={errors.price?.message} {...register('price')} />
            <Input label="Số lượng tồn kho *" type="number" placeholder="20" error={errors.stock?.message} {...register('stock')} />
            <Select label="Danh mục sản phẩm *" options={categories} placeholder="Chọn danh mục" error={errors.categoryId?.message} {...register('categoryId')} />
          </div>
        </div>

        {/* Material / Origin */}
        <div className="bg-white rounded-3xl border border-[#E6DED5] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#2F2722] pb-2 border-b border-[#E6DED5]/60 flex items-center gap-2">
            <Package size={16} className="text-[#A65A3A]" /> 3. Chất liệu & Xuất xứ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Chất liệu" placeholder="Gốm, vải lụa, gỗ..." {...register('material')} />
            <Input label="Xuất xứ" placeholder="Hội An, Đà Nẵng..." {...register('origin')} />
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-3xl border border-[#E6DED5] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#2F2722] pb-2 border-b border-[#E6DED5]/60 flex items-center gap-2">
            <ImagePlus size={16} className="text-[#A65A3A]" /> 4. Ảnh sản phẩm
          </h2>
          <ImageUploader
            images={uploadedImages}
            onChange={setUploadedImages}
            maxImages={5}
            folder="products"
          />
          <p className="text-[10px] text-[#7A6A5E]">Ảnh đầu tiên sẽ được dùng làm ảnh đại diện (thumbnail). Nếu không upload sẽ dùng ảnh mặc định.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" size="lg" isLoading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Đăng bán ngay'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate('/host/products')}>
            Hủy bỏ
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
