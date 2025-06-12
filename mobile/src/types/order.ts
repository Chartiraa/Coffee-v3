// Ürün tipi
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url: string;
  is_active: boolean;
  preparation_time: number;
  is_available: boolean;
  options?: ProductOption[];
}

// Kategori tipi
export interface Category {
  id: number;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

// Ürün seçeneği tipi
export interface ProductOption {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  is_required: boolean;
  values: ProductOptionValue[];
}

// Ürün seçeneği değeri tipi
export interface ProductOptionValue {
  id: number;
  option_id: number;
  value: string;
  price_modifier: number;
  is_default: boolean;
  sort_order: number;
}

// Sipariş öğesi için seçilen seçenek
export interface OrderItemOption {
  option_id: number;
  value_id: number;
}

// Sipariş öğesi
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  options?: OrderItemOption[];
}

// Masa tipi
export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: string;
  is_active: boolean;
  location?: string;
}

// Sipariş tipi
export interface Order {
  id: number;
  table_id: number;
  status: 'created' | 'in_progress' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  staff_id?: number;
  staff_name?: string;
} 