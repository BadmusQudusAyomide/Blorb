export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
  selectedColor?: string;
  selectedSize?: string;
  sellerId: string; // Required field for seller identification
  sellerName?: string; // Optional field for seller name
} 