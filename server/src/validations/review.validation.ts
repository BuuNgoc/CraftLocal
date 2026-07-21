import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID là bắt buộc'),
  rating: z.number().min(1, 'Rating tối thiểu là 1').max(5, 'Rating tối đa là 5'),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
});
