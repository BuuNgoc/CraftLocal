import { z } from 'zod';

export const createWorkshopSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  address: z.any().optional(),
  location: z.string().optional(),
  locationLabel: z.string().optional(),
  price: z.coerce.number().min(0, 'Giá không được âm'),
  duration: z.coerce.number().min(1, 'Thời lượng phải lớn hơn 0'),
  maxGuestsPerSlot: z.coerce.number().min(1, 'Số khách tối đa phải lớn hơn 0').optional(),
  images: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  includedItems: z.array(z.string()).optional(),
  requiredItems: z.array(z.string()).optional(),
  language: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
});

export const updateWorkshopSchema = createWorkshopSchema.partial();

