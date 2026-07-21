import { z } from 'zod';

export const workshopSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  category: z.string().min(1, 'Danh mục bắt buộc'),
  price: z.coerce.number().min(1000, 'Giá tối thiểu 1.000 VND'),
  duration: z.coerce.number().min(30, 'Thời lượng tối thiểu 30 phút'),
  address: z.string().min(5, 'Địa chỉ bắt buộc'),
  location: z.string().min(1, 'Khu vực bắt buộc'),
  maxGuestsPerSlot: z.coerce.number().min(1, 'Tối thiểu 1 khách').optional(),
});

export type WorkshopFormData = z.infer<typeof workshopSchema>;
