import { Pool } from 'pg';
import db from '../config/database';
import ProductModel from './product.model';
import ProductOptionModel from './product-option.model';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  product_price: number;
  total_price: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  product_name: string;
  product_options?: OrderItemOption[];
}

export interface OrderItemOption {
  id: number;
  order_item_id: number;
  option_id: number;
  option_value_id: number;
  option_name: string;
  option_value: string;
  price_modifier: number;
}

export interface CreateOrderItemDTO {
  product_id: number;
  quantity: number;
  notes?: string;
  options?: {
    option_id: number;
    value_id: number;
  }[];
}

export interface Order {
  id: number;
  table_id: number;
  user_id: number;
  status: 'created' | 'in_progress' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
}

export interface CreateOrderDTO {
  table_id: number;
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderStatusDTO {
  status: Order['status'];
}

export interface UpdateOrderDTO {
  table_id: number;
  items: CreateOrderItemDTO[];
  notes?: string;
}

class OrderModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async create(orderData: CreateOrderDTO, userId: number): Promise<Order | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Sipariş kaydı oluştur
      const orderResult = await client.query(
        `INSERT INTO orders (table_id, user_id, status, total_amount)
         VALUES ($1, $2, 'created', 0)
         RETURNING *`,
        [orderData.table_id, userId]
      );
      
      const order = orderResult.rows[0];
      const orderId = order.id;
      
      let totalAmount = 0;
      
      // Sipariş öğelerini ekle
      for (const item of orderData.items) {
        // Ürün bilgilerini al
        const product = await ProductModel.findById(item.product_id);
        if (!product) {
          throw new Error(`Ürün bulunamadı: ${item.product_id}`);
        }
        
        // Ürün fiyatını hesapla
        let productPrice = product.price;
        let itemTotalPrice = productPrice * item.quantity;
        
        // Sipariş öğesi ekle
        const orderItemResult = await client.query(
          `INSERT INTO order_items 
           (order_id, product_id, product_name, quantity, product_price, total_price, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            orderId, 
            item.product_id, 
            product.name,
            item.quantity, 
            productPrice, 
            itemTotalPrice, 
            item.notes || null
          ]
        );
        
        const orderItem = orderItemResult.rows[0];
        
        // Seçenekleri işle (ürün opsiyonları)
        if (item.options && item.options.length > 0) {
          for (const option of item.options) {
            // Seçenek değerini bul
            const optionValue = await ProductOptionModel.findOptionValueById(option.value_id);
            if (!optionValue) {
              throw new Error(`Seçenek değeri bulunamadı: ${option.value_id}`);
            }
            
            // Seçeneği bul
            const optionObj = await ProductOptionModel.findOptionById(option.option_id);
            if (!optionObj) {
              throw new Error(`Seçenek bulunamadı: ${option.option_id}`);
            }
            
            // Seçenek fiyat modifikasyonu ürün fiyatına ekle
            const priceModifier = optionValue.price_modifier;
            
            // Seçenek kaydı
            await client.query(
              `INSERT INTO order_item_options
               (order_item_id, option_id, option_value_id, option_name, option_value, price_modifier)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                orderItem.id,
                option.option_id,
                option.value_id,
                optionObj.name,
                optionValue.value,
                priceModifier
              ]
            );
            
            // Toplam fiyata seçenek modifikasyonunu ekle
            itemTotalPrice += priceModifier * item.quantity;
          }
          
          // Güncellenen toplam fiyatla sipariş öğesini güncelle
          await client.query(
            `UPDATE order_items
             SET total_price = $1
             WHERE id = $2`,
            [itemTotalPrice, orderItem.id]
          );
        }
        
        // Sipariş toplam tutarını güncelle
        totalAmount += itemTotalPrice;
      }
      
      // Sipariş toplamını güncelle
      await client.query(
        `UPDATE orders 
         SET total_amount = $1
         WHERE id = $2`,
        [totalAmount, orderId]
      );
      
      // İşlemi tamamla
      await client.query('COMMIT');
      
      // Detaylı sipariş bilgisini döndür
      return this.findById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: number): Promise<Order | null> {
    const orderResult = await this.pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return null;
    }
    
    const order = orderResult.rows[0];
    
    // Sipariş öğelerini getir
    const itemsResult = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC',
      [id]
    );
    
    const items = itemsResult.rows;
    
    // Her öğe için seçenekleri getir
    for (const item of items) {
      const optionsResult = await this.pool.query(
        'SELECT * FROM order_item_options WHERE order_item_id = $1',
        [item.id]
      );
      
      item.product_options = optionsResult.rows;
    }
    
    order.items = items;
    
    return order;
  }
  
  async findByTableId(tableId: number, status?: Order['status']): Promise<Order[]> {
    let query = 'SELECT * FROM orders WHERE table_id = $1';
    const queryParams: any[] = [tableId];
    
    if (status) {
      query += ' AND status = $2';
      queryParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, queryParams);
    return result.rows;
  }
  
  async findAll(status?: string): Promise<Order[]> {
    let query = 'SELECT * FROM orders';
    const queryParams: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      queryParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, queryParams);
    const orders = result.rows;
    
    // Her sipariş için öğeleri ve seçenekleri getir
    for (const order of orders) {
      // Sipariş öğelerini getir
      const itemsResult = await this.pool.query(
        'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC',
        [order.id]
      );
      
      const items = itemsResult.rows;
      
      // Her öğe için seçenekleri getir
      for (const item of items) {
        const optionsResult = await this.pool.query(
          'SELECT * FROM order_item_options WHERE order_item_id = $1',
          [item.id]
        );
        
        item.product_options = optionsResult.rows;
      }
      
      order.items = items;
    }
    
    return orders;
  }
  
  async updateStatus(id: number, updateData: UpdateOrderStatusDTO): Promise<Order | null> {
    const result = await this.pool.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [updateData.status, id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.findById(id);
  }
  
  async cancel(id: number): Promise<Order | null> {
    const result = await this.pool.query(
      `UPDATE orders 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.findById(id);
  }

  async update(id: number, updateData: UpdateOrderDTO, userId: number): Promise<Order | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Sipariş var mı kontrol et
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1',
        [id]
      );
      
      if (orderResult.rows.length === 0) {
        return null;
      }
      
      const currentOrder = orderResult.rows[0];
      
      // Sadece 'created' veya 'in_progress' durumundaki siparişleri güncelle
      if (currentOrder.status !== 'created' && currentOrder.status !== 'in_progress') {
        throw new Error(`Sipariş durumu "${currentOrder.status}" olduğu için güncellenemez.`);
      }

      // Masayı güncelle
      await client.query(
        'UPDATE orders SET table_id = $1 WHERE id = $2',
        [updateData.table_id, id]
      );
      
      // Mevcut sipariş öğelerini sil
      await client.query(
        'DELETE FROM order_item_options WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)',
        [id]
      );
      
      await client.query(
        'DELETE FROM order_items WHERE order_id = $1',
        [id]
      );
      
      let totalAmount = 0;
      
      // Yeni sipariş öğelerini ekle
      for (const item of updateData.items) {
        // Ürün bilgilerini al
        const product = await ProductModel.findById(item.product_id);
        if (!product) {
          throw new Error(`Ürün bulunamadı: ${item.product_id}`);
        }
        
        // Ürün fiyatını hesapla
        let productPrice = product.price;
        let itemTotalPrice = productPrice * item.quantity;
        
        // Sipariş öğesi ekle
        const orderItemResult = await client.query(
          `INSERT INTO order_items 
           (order_id, product_id, product_name, quantity, product_price, total_price, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            id, 
            item.product_id, 
            product.name,
            item.quantity, 
            productPrice, 
            itemTotalPrice, 
            item.notes || null
          ]
        );
        
        const orderItem = orderItemResult.rows[0];
        
        // Seçenekleri işle (ürün opsiyonları)
        if (item.options && item.options.length > 0) {
          for (const option of item.options) {
            // Seçenek değerini bul
            const optionValue = await ProductOptionModel.findOptionValueById(option.value_id);
            if (!optionValue) {
              throw new Error(`Seçenek değeri bulunamadı: ${option.value_id}`);
            }
            
            // Seçeneği bul
            const optionObj = await ProductOptionModel.findOptionById(option.option_id);
            if (!optionObj) {
              throw new Error(`Seçenek bulunamadı: ${option.option_id}`);
            }
            
            // Seçenek fiyat modifikasyonu ürün fiyatına ekle
            const priceModifier = optionValue.price_modifier;
            
            // Seçenek kaydı
            await client.query(
              `INSERT INTO order_item_options
               (order_item_id, option_id, option_value_id, option_name, option_value, price_modifier)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                orderItem.id,
                option.option_id,
                option.value_id,
                optionObj.name,
                optionValue.value,
                priceModifier
              ]
            );
            
            // Toplam fiyata seçenek modifikasyonunu ekle
            itemTotalPrice += priceModifier * item.quantity;
          }
          
          // Güncellenen toplam fiyatla sipariş öğesini güncelle
          await client.query(
            `UPDATE order_items
             SET total_price = $1
             WHERE id = $2`,
            [itemTotalPrice, orderItem.id]
          );
        }
        
        // Sipariş toplam tutarını güncelle
        totalAmount += itemTotalPrice;
      }
      
      // Sipariş toplamını güncelle
      await client.query(
        `UPDATE orders 
         SET total_amount = $1, updated_at = NOW()
         WHERE id = $2`,
        [totalAmount, id]
      );
      
      // İşlemi tamamla
      await client.query('COMMIT');
      
      // Detaylı sipariş bilgisini döndür
      return this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new OrderModel(); 