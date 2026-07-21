export interface Timeslot {
  _id: string;
  workshopId: any;
  hostId: any;
  tourGuideId?: any;
  startTime: string;
  endTime: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  price: number;
  status: 'AVAILABLE' | 'FULL' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  note?: string;
  createdAt: string;
  updatedAt: string;
}
