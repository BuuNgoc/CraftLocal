import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, 'Tên sản phẩm phải từ 3 ký tự trở lên'),
  description: z.string().min(10, 'Mô tả sản phẩm phải từ 10 ký tự trở lên'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục sản phẩm'),
  price: z.coerce.number().min(1000, 'Đơn giá phải từ 1.000₫ trở lên'),
  stock: z.coerce.number().min(0, 'Số lượng tồn kho không được âm'),
  material: z.string(),
  origin: z.string(),
  shortDescription: z.string(),
});

export type ProductFormData = z.infer<typeof productSchema>;
