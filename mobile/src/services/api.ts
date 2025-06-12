import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.65:3000/api/v1'; // API versiyonu v1 olarak güncellendi

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3MDcwNDM1LCJleHAiOjE3NDcxNTY4MzV9.f0iGCj3RrIgm3TXUUUoaVhX0MRzPhehLI6aHNiVbdmk' // Gerçek admin token'ı
  },
});

// Menü servisi
export const menuService = {
  getActiveCategories: () => api.get('/menu/categories/active'),
  getActiveProducts: () => api.get('/menu/products/active'),
  getProductById: (id: number) => api.get(`/menu/products/${id}`),
  getProductsByCategory: (categoryId: number) => api.get(`/menu/categories/${categoryId}/products?activeOnly=true&availableOnly=true`),
};

// Masa servisi
export const tableService = {
  getTables: (activeOnly: boolean = true) => api.get(`/tables${activeOnly ? '?activeOnly=true' : ''}`),
  getTableById: (id: number) => api.get(`/tables/${id}`),
  updateTableStatus: (id: number, status: string) => api.patch(`/tables/${id}/status`, { status }),
};

// Sipariş servisi
export const orderService = {
  createOrder: (data: any) => api.post('/orders', data),
  updateOrder: (id: number, data: any) => api.put(`/orders/${id}`, data),
  getOrderById: (id: number) => api.get(`/orders/${id}`),
  getTableOrders: (tableId: number, status?: string) => {
    let url = `/orders/table/${tableId}`;
    if (status) {
      if (status === 'active') {
        // Aktif siparişler için tüm aktif durumları gönder
        url += '?status=created,in_progress,ready,delivered';
      } else {
        url += `?status=${status}`;
      }
    }
    return api.get(url);
  },
  updateOrderStatus: (id: number, status: 'created' | 'in_progress' | 'ready' | 'delivered' | 'completed' | 'cancelled') => 
    api.patch(`/orders/${id}/status`, { status }),
}; 