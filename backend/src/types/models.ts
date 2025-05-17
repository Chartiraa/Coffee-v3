export interface User {
  id: number;
  username: string;
  password: string;
  full_name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  table_id: number;
  user_id: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  total_amount: number;
  payment_method?: 'cash' | 'credit_card' | 'meal_card';
  payment_status?: 'pending' | 'paid' | 'refunded';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  notes?: string;
  created_at: Date;
}

export interface Inventory {
  id: number;
  product_id: number;
  quantity: number;
  minimum_quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryTransaction {
  id: number;
  inventory_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  notes?: string;
  created_at: Date;
} 