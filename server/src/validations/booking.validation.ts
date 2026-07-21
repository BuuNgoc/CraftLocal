import { z } from 'zod';

export const createBookingSchema = z.object({
  timeslotId: z.string().min(1, 'Timeslot ID là bắt buộc'),
  quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
});
