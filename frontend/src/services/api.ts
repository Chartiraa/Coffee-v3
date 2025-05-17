import axios from 'axios';
import { getToken } from '../utils/auth';

// API temel URL'i
const API_URL = 'http://localhost:3000/api/v1';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // CORS ile çerezleri göndermek için
});

// Request interceptor - Token ekleme
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token süresi doldu veya yetkisiz erişim
      localStorage.removeItem('token');
      // Giriş sayfasına yönlendirme işlemi burada yapılabilir
    }
    return Promise.reject(error);
  }
);

// API hizmetleri
export const authService = {
  login: async (googleToken: string) => {
    try {
      const response = await api.post('/auth/google-token', { token: googleToken });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Profil bilgisi için önbellek değişkenleri
  _profileCache: null as any,
  _profileCacheTimestamp: 0,
  _profileCacheTimeout: 60000, // 1 dakika
  
  getProfile: async () => {
    try {
      const now = Date.now();
      // Önbellekte profil varsa ve süresi dolmadıysa onu döndür
      if (
        authService._profileCache && 
        now - authService._profileCacheTimestamp < authService._profileCacheTimeout
      ) {
        return { data: authService._profileCache };
      }
      
      // Yoksa API'den çek
      const response = await api.get('/auth/profile');
      
      // Önbelleğe al
      authService._profileCache = response.data;
      authService._profileCacheTimestamp = now;
      
      return response;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    // Çıkış yapınca önbelleği temizle
    authService._profileCache = null;
    authService._profileCacheTimestamp = 0;
  }
};

export const menuService = {
  getCategories: async () => {
    try {
      return await api.get('/menu/categories');
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },
  
  getActiveCategories: async () => {
    try {
      return await api.get('/menu/categories/active');
    } catch (error) {
      console.error('Get active categories error:', error);
      throw error;
    }
  },
  
  getProducts: async (categoryId?: number) => {
    try {
      const url = categoryId ? `/menu/categories/${categoryId}/products` : '/menu/products';
      return await api.get(url);
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  },
  
  getActiveProducts: async (categoryId?: number) => {
    try {
      if (categoryId) {
        return await api.get(`/menu/categories/${categoryId}/products?activeOnly=true&availableOnly=true`);
      } else {
        return await api.get('/menu/products/active');
      }
    } catch (error) {
      console.error('Get active products error:', error);
      throw error;
    }
  },
  
  getProductById: async (productId: number) => {
    try {
      return await api.get(`/menu/products/${productId}`);
    } catch (error) {
      console.error('Get product by id error:', error);
      throw error;
    }
  },
  
  createProduct: async (productData: any) => {
    try {
      return await api.post('/menu/products', productData);
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },
  
  updateProduct: async (productId: number, productData: any) => {
    try {
      return await api.put(`/menu/products/${productId}`, productData);
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  },
  
  deleteProduct: async (productId: number) => {
    try {
      return await api.delete(`/menu/products/${productId}`);
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  },
  
  createCategory: async (categoryData: any) => {
    try {
      return await api.post('/menu/categories', categoryData);
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  },
  
  updateCategory: async (categoryId: number, categoryData: any) => {
    try {
      return await api.put(`/menu/categories/${categoryId}`, categoryData);
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  },
  
  deleteCategory: async (categoryId: number) => {
    try {
      return await api.delete(`/menu/categories/${categoryId}`);
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  },

  // Ürün seçenekleri (options) için metotlar
  getOptions: async () => {
    try {
      return await api.get('/menu/options');
    } catch (error) {
      console.error('Get options error:', error);
      throw error;
    }
  },

  getOptionById: async (optionId: number) => {
    try {
      return await api.get(`/menu/options/${optionId}`);
    } catch (error) {
      console.error('Get option by id error:', error);
      throw error;
    }
  },

  createOption: async (optionData: any) => {
    try {
      return await api.post('/menu/options', optionData);
    } catch (error) {
      console.error('Create option error:', error);
      throw error;
    }
  },

  updateOption: async (optionId: number, optionData: any) => {
    try {
      return await api.put(`/menu/options/${optionId}`, optionData);
    } catch (error) {
      console.error('Update option error:', error);
      throw error;
    }
  },

  deleteOption: async (optionId: number) => {
    try {
      return await api.delete(`/menu/options/${optionId}`);
    } catch (error) {
      console.error('Delete option error:', error);
      throw error;
    }
  },

  // Seçenek değerleri (option values) için metotlar
  getOptionValues: async (optionId: number) => {
    try {
      return await api.get(`/menu/options/${optionId}/values`);
    } catch (error) {
      console.error('Get option values error:', error);
      throw error;
    }
  },

  createOptionValue: async (optionId: number, valueData: any) => {
    try {
      return await api.post(`/menu/options/${optionId}/values`, valueData);
    } catch (error) {
      console.error('Create option value error:', error);
      throw error;
    }
  },

  updateOptionValue: async (valueId: number, valueData: any) => {
    try {
      return await api.put(`/menu/values/${valueId}`, valueData);
    } catch (error) {
      console.error('Update option value error:', error);
      throw error;
    }
  },

  deleteOptionValue: async (valueId: number) => {
    try {
      return await api.delete(`/menu/values/${valueId}`);
    } catch (error) {
      console.error('Delete option value error:', error);
      throw error;
    }
  },

  // Ürün ve seçenek ilişkileri için metotlar
  getProductOptions: async (productId: number) => {
    try {
      return await api.get(`/menu/products/${productId}/options`);
    } catch (error) {
      console.error('Get product options error:', error);
      throw error;
    }
  },

  addProductOption: async (productId: number, optionData: any) => {
    try {
      return await api.post(`/menu/products/${productId}/options`, optionData);
    } catch (error) {
      console.error('Add product option error:', error);
      throw error;
    }
  },

  removeProductOption: async (productId: number, optionId: number) => {
    try {
      return await api.delete(`/menu/products/${productId}/options/${optionId}`);
    } catch (error) {
      console.error('Remove product option error:', error);
      throw error;
    }
  }
};

export const tableService = {
  getTables: async (activeOnly?: boolean) => {
    try {
      let url = '/tables';
      if (activeOnly) {
        url += '?activeOnly=true';
      }
      return await api.get(url);
    } catch (error) {
      console.error('Get tables error:', error);
      throw error;
    }
  },
  
  getTableById: async (tableId: number) => {
    try {
      return await api.get(`/tables/${tableId}`);
    } catch (error) {
      console.error('Get table by id error:', error);
      throw error;
    }
  },
  
  createTable: async (tableData: any) => {
    try {
      return await api.post('/tables', tableData);
    } catch (error) {
      console.error('Create table error:', error);
      throw error;
    }
  },
  
  updateTable: async (tableId: number, tableData: any) => {
    try {
      return await api.put(`/tables/${tableId}`, tableData);
    } catch (error) {
      console.error('Update table error:', error);
      throw error;
    }
  },
  
  deleteTable: async (tableId: number) => {
    try {
      return await api.delete(`/tables/${tableId}`);
    } catch (error) {
      console.error('Delete table error:', error);
      throw error;
    }
  },
  
  updateTableStatus: async (tableId: number, statusData: any) => {
    try {
      console.log(`API isteği: PATCH /tables/${tableId}/status, Veri:`, statusData);
      const response = await api.patch(`/tables/${tableId}/status`, statusData);
      console.log(`API yanıtı: PATCH /tables/${tableId}/status, Yanıt:`, response.data);
      return response;
    } catch (error) {
      console.error('Update table status error:', error);
      throw error;
    }
  }
};

export const orderService = {
  createOrder: async (orderData: any) => {
    try {
      return await api.post('/orders', orderData);
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },
  
  // Sipariş güncelleme fonksiyonu
  updateOrder: async (orderId: number, orderData: any) => {
    try {
      return await api.put(`/orders/${orderId}`, orderData);
    } catch (error) {
      console.error('Update order error:', error);
      throw error;
    }
  },
  
  getOrders: async (status?: string) => {
    try {
      const url = status ? `/orders?status=${status}` : '/orders';
      return await api.get(url);
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },
  
  getOrderById: async (orderId: number) => {
    try {
      return await api.get(`/orders/${orderId}`);
    } catch (error) {
      console.error('Get order by id error:', error);
      throw error;
    }
  },
  
  getTableOrders: async (tableId: number, status?: string, excludeCompleted: boolean = true) => {
    try {
      let url = `/orders/table/${tableId}`;
      
      // Status parametresi eklenmiş mi?
      if (status) {
        url += `?status=${status}`;
      }
      
      // Tamamlanmış siparişleri hariç tutma parametresi
      if (excludeCompleted) {
        url += status ? '&' : '?';
        url += 'excludeCompleted=true';
      }
      
      return await api.get(url);
    } catch (error) {
      console.error('Get table orders error:', error);
      throw error;
    }
  },
  
  updateOrderStatus: async (orderId: number, status: string) => {
    try {
      return await api.patch(`/orders/${orderId}/status`, { status });
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },
  
  cancelOrder: async (orderId: number) => {
    try {
      return await api.delete(`/orders/${orderId}`);
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  }
};

export const inventoryService = {
  getInventoryItems: async (category?: string) => {
    try {
      const url = category ? `/inventory?category=${category}` : '/inventory';
      return await api.get(url);
    } catch (error) {
      console.error('Get inventory items error:', error);
      throw error;
    }
  },
  
  getLowStockItems: async () => {
    try {
      return await api.get('/inventory/low-stock');
    } catch (error) {
      console.error('Get low stock items error:', error);
      throw error;
    }
  },

  // Yeni stok ürünü ekleme
  createInventoryItem: async (itemData: any) => {
    try {
      return await api.post('/inventory', itemData);
    } catch (error) {
      console.error('Create inventory item error:', error);
      throw error;
    }
  },

  // Stok ürünü güncelleme
  updateInventoryItem: async (itemId: number, itemData: any) => {
    try {
      return await api.put(`/inventory/${itemId}`, itemData);
    } catch (error) {
      console.error('Update inventory item error:', error);
      throw error;
    }
  },

  // Stok ürünü silme
  deleteInventoryItem: async (itemId: number) => {
    try {
      return await api.delete(`/inventory/${itemId}`);
    } catch (error) {
      console.error('Delete inventory item error:', error);
      throw error;
    }
  },

  // Stok miktarı güncelleme
  updateStockQuantity: async (itemId: number, quantity: number, transactionType: 'purchase' | 'usage', notes?: string, unitCost?: number) => {
    try {
      const response = await api.patch(`/inventory/${itemId}/quantity`, {
        quantity,
        transaction_type: transactionType,
        unit_cost: unitCost,
        notes
      });
      return response;
    } catch (error) {
      console.error('Update stock quantity error:', error);
      throw error;
    }
  }
};

export const paymentService = {
  createPayment: async (paymentData: any) => {
    try {
      console.log('Ödeme verileri:', paymentData);
      return await api.post('/payments', paymentData);
    } catch (error) {
      console.error('Create payment error:', error);
      throw error;
    }
  },
  
  getPayments: async (startDate?: string, endDate?: string) => {
    try {
      console.log('Ödeme geçmişi isteği başlıyor:', { startDate, endDate });
      let url = '/payments/recent';
      const params = new URLSearchParams();
      
      if (startDate && endDate) {
        // Tarihleri doğrudan kullan (zaten YYYY-MM-DD formatında)
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      console.log('Ödeme geçmişi isteği:', url);
      const response = await api.get(url);
      console.log('Ödeme geçmişi yanıtı:', response.data);
      return response;
    } catch (error) {
      console.error('Get payments error:', error);
      throw error;
    }
  },
  
  getPaymentDetails: async (paymentId: number) => {
    try {
      return await api.get(`/payments/${paymentId}`);
    } catch (error) {
      console.error('Get payment details error:', error);
      throw error;
    }
  },
  
  getCashRegisterBalance: async () => {
    try {
      return await api.get('/payments/cash-register/balance');
    } catch (error) {
      console.error('Get cash register balance error:', error);
      throw error;
    }
  },
  
  getDailySalesReport: async (date?: string) => {
    try {
      const url = date ? `/payments/reports/daily-sales?date=${date}` : '/payments/reports/daily-sales';
      console.log('Rapor çekme URL:', url);
      const response = await api.get(url);
      
      // Veri doğrulama ve işleme
      if (response.data) {
        // Veri dönüş tipini yazdır
        console.log('Rapor veri tipi:', typeof response.data);
        
        // Boş nesne kontrolü
        if (Object.keys(response.data).length === 0) {
          console.log('Rapor verisi boş');
          response.data = {
            date: date || new Date().toISOString().split('T')[0],
            total_sales: 0,
            total_orders: 0,
            average_order_value: 0,
            payment_methods: { cash: 0, credit_card: 0, debit_card: 0, other: 0 },
            hourly_sales: [],
            top_products: []
          };
        } else {
          console.log('Rapor verisi mevcut:', Object.keys(response.data));
        }
      }
      
      return response;
    } catch (error) {
      console.error('Get daily sales report error:', error);
      // Rapor alınamadığında, boş data döndür
      return {
        data: {
          date: date || new Date().toISOString().split('T')[0],
          total_sales: 0,
          total_orders: 0,
          average_order_value: 0,
          payment_methods: { cash: 0, credit_card: 0, debit_card: 0, other: 0 },
          hourly_sales: [],
          top_products: []
        }
      };
    }
  },
  
  // Masa bazlı ödeme fonksiyonları
  getPaymentsByTableId: async (tableId: number) => {
    try {
      return await api.get(`/payments/table/${tableId}`);
    } catch (error) {
      console.error('Get table payments error:', error);
      throw error;
    }
  },
  
  getTableItemsPaymentStatus: async (tableId: number) => {
    try {
      return await api.get(`/payments/table/${tableId}/items-status`);
    } catch (error) {
      console.error('Get table items payment status error:', error);
      throw error;
    }
  },
  
  getActiveTablePayment: async (tableId: number) => {
    try {
      return await api.get(`/payments/table/${tableId}/active-payment`);
    } catch (error) {
      console.error('Get active table payment error:', error);
      throw error;
    }
  },
  
  applyTableDiscount: async (tablePaymentId: number, discountData: any) => {
    try {
      return await api.post(`/payments/table-payment/${tablePaymentId}/discount`, discountData);
    } catch (error) {
      console.error('Apply table discount error:', error);
      throw error;
    }
  },
  
  getSalesReport: async (startDate: string, endDate: string) => {
    try {
      console.log('Satış raporu isteği başlıyor:', { startDate, endDate });
      const response = await api.get('/payments/reports/sales-report', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      console.log('Satış raporu yanıtı:', response.data);
      return response;
    } catch (error) {
      console.error('Satış raporu alınırken hata:', error);
      throw error;
    }
  }
};

export default api; 