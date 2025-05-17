import { socketService } from '../index';
import { Request, Response } from 'express';
import pool from '../config/database';

class OrderService {
  // Yeni sipariş oluştur
  async createOrder(orderData: any) {
    try {
      // Sipariş oluştur
      const query = `
        INSERT INTO orders (table_id, status, total_amount, staff_id, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [
        orderData.table_id,
        'pending',
        orderData.total_amount,
        orderData.staff_id,
        orderData.notes
      ];

      const result = await pool.query(query, values);
      const order = result.rows[0];

      // Sipariş öğelerini ekle
      if (orderData.items && orderData.items.length > 0) {
        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        for (const item of orderData.items) {
          await pool.query(itemQuery, [
            order.id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes
          ]);
        }
      }

      // Masa durumunu güncelle
      const tableQuery = `
        UPDATE tables
        SET status = 'occupied'
        WHERE id = $1
        RETURNING *
      `;
      const updatedTable = await pool.query(tableQuery, [order.table_id]);

      // Socket.IO bildirimleri gönder
      socketService.emitNewOrder(order);
      socketService.emitTableUpdate(updatedTable.rows[0]);

      return order;
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      throw error;
    }
  }

  // Siparişi güncelle
  async updateOrder(orderId: number, updateData: any) {
    try {
      const query = `
        UPDATE orders
        SET status = $1, total_amount = $2, notes = $3
        WHERE id = $4
        RETURNING *
      `;
      const values = [
        updateData.status,
        updateData.total_amount,
        updateData.notes,
        orderId
      ];

      const result = await pool.query(query, values);
      const order = result.rows[0];

      // Socket.IO bildirimi gönder
      socketService.emitOrderUpdate(order);

      return order;
    } catch (error) {
      console.error('Sipariş güncelleme hatası:', error);
      throw error;
    }
  }

  // Sipariş durumunu güncelle
  async updateOrderStatus(orderId: number, status: string) {
    try {
      const query = `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [status, orderId]);
      const order = result.rows[0];

      // Socket.IO bildirimi gönder
      socketService.emitOrderUpdate(order);

      // Sipariş tamamlandıysa veya iptal edildiyse masa durumunu kontrol et
      if (status === 'completed' || status === 'cancelled') {
        // Masanın başka aktif siparişi var mı kontrol et
        const activeOrdersQuery = `
          SELECT COUNT(*) as count
          FROM orders
          WHERE table_id = $1 AND status = 'pending' AND id != $2
        `;
        const activeOrders = await pool.query(activeOrdersQuery, [order.table_id, orderId]);

        if (activeOrders.rows[0].count === 0) {
          // Masa durumunu güncelle
          const tableQuery = `
            UPDATE tables
            SET status = 'available'
            WHERE id = $1
            RETURNING *
          `;
          const updatedTable = await pool.query(tableQuery, [order.table_id]);
          socketService.emitTableUpdate(updatedTable.rows[0]);
        }
      }

      return order;
    } catch (error) {
      console.error('Sipariş durumu güncelleme hatası:', error);
      throw error;
    }
  }

  // Siparişi sil
  async deleteOrder(orderId: number) {
    try {
      const query = `
        DELETE FROM orders
        WHERE id = $1
        RETURNING *
      `;
      const result = await pool.query(query, [orderId]);
      const order = result.rows[0];

      // Socket.IO ile sipariş silme bildirimi gönder
      socketService.emitOrderDelete(orderId);

      // Masanın başka aktif siparişi yoksa durumunu güncelle
      const tableHasActiveOrdersQuery = `
        SELECT COUNT(*) as count
        FROM orders
        WHERE table_id = $1 AND status = 'pending'
      `;
      const tableHasActiveOrders = await pool.query(tableHasActiveOrdersQuery, [order.table_id]);

      if (tableHasActiveOrders.rows[0].count === 0) {
        const tableQuery = `
          UPDATE tables
          SET status = 'available'
          WHERE id = $1
          RETURNING *
        `;
        const updatedTable = await pool.query(tableQuery, [order.table_id]);
        socketService.emitTableUpdate(updatedTable.rows[0]);
      }

      return order;
    } catch (error) {
      console.error('Sipariş silme hatası:', error);
      throw error;
    }
  }

  // Tüm siparişleri getir
  async getAllOrders() {
    try {
      const query = `
        SELECT o.*, t.name as table_name, t.status as table_status,
               json_agg(json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price,
                 'notes', oi.notes
               )) as items
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id, t.id
        ORDER BY o.created_at DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Siparişleri getirme hatası:', error);
      throw error;
    }
  }

  // Belirli bir siparişi getir
  async getOrderById(orderId: number) {
    try {
      const query = `
        SELECT o.*, t.name as table_name, t.status as table_status,
               json_agg(json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price,
                 'notes', oi.notes
               )) as items
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id, t.id
      `;
      
      const result = await pool.query(query, [orderId]);
      return result.rows[0];
    } catch (error) {
      console.error('Sipariş getirme hatası:', error);
      throw error;
    }
  }

  // Masa siparişlerini getir
  async getOrdersByTableId(tableId: number) {
    try {
      const query = `
        SELECT o.*, t.name as table_name, t.status as table_status,
               json_agg(json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price,
                 'notes', oi.notes
               )) as items
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.table_id = $1 AND o.status = 'pending'
        GROUP BY o.id, t.id
        ORDER BY o.created_at DESC
      `;
      
      const result = await pool.query(query, [tableId]);
      return result.rows;
    } catch (error) {
      console.error('Masa siparişlerini getirme hatası:', error);
      throw error;
    }
  }
}

export default new OrderService(); 