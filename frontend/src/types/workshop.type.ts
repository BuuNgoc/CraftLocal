export interface Address {
  addressLine: string;
  ward?: string;
  district?: string;
  city: string;
  province: string;
  country: string;
  fullAddress: string;
  note?: string;
}

export interface MapLocation {
  lat: number;
  lng: number;
}

export type WorkshopStatus = 'ACTIVE' | 'HIDDEN' | 'DRAFT' | 'DELETED';
export type WorkshopDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Workshop {
  _id: string;
  hostId: any;
  categoryId: any;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  address: Address;
  locationLabel: string;
  mapLocation: MapLocation;
  hostName: string;
  hostPhone: string;
  hostWorkshopName: string;
  price: number;
  duration: number;
  maxGuestsPerSlot: number;
  images: string[];
  thumbnail?: string;
  includedItems: string[];
  requiredItems: string[];
  languages: string[];
  difficulty: WorkshopDifficulty;
  status: WorkshopStatus;
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopFilters {
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}
