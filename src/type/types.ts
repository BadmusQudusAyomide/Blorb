// src/types/types.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
}

export interface Order {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder?: Date;
}