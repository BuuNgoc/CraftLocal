export interface Product {
  _id: string;
  hostId: any;
  categoryId: any;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  stock: number;
  sold: number;
  images: string[];
  thumbnail?: string;
  material?: string;
  origin?: string;
  originAddress?: { fullAddress: string };
  weight?: number;
  status: 'ACTIVE' | 'HIDDEN' | 'OUT_OF_STOCK' | 'DELETED';
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

