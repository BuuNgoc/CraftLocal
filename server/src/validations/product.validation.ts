import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục sản phẩm'),
  price: z.number().min(0, 'Giá không được âm'),
  stock: z.number().min(0, 'Số lượng không được âm'),
  images: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  material: z.string().optional(),
  origin: z.string().optional(),
  originAddress: z.any().optional(),
  weight: z.number().optional(),
  status: z.string().optional(),
}).passthrough(); // Allow extra fields to pass through

export const updateProductSchema = createProductSchema.partial();
