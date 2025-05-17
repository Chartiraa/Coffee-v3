import { Pool } from 'pg';
import db from '../config/database';

export interface OrderItemPayment {
  id: number;
  order_item_id: number;
  payment_id: number;
  paid_quantity: number;
  amount: number;
  created_at: Date;
}

export interface CreateOrderItemPaymentDTO {
  order_item_id: number;
  payment_id: number;
  paid_quantity: number;
  amount: number;
}

class OrderItemPaymentModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  /**
   * Yeni bir sipariş öğesi ödemesi oluşturur
   */
  async create(data: CreateOrderItemPaymentDTO): Promise<OrderItemPayment> {
    const result = await this.pool.query(
      `INSERT INTO order_item_payments
       (order_item_id, payment_id, paid_quantity, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.order_item_id, data.payment_id, data.paid_quantity, data.amount]
    );
    
    return result.rows[0];
  }

  /**
   * Sipariş öğesine göre ödemeleri getirir
   */
  async findByOrderItemId(orderItemId: number): Promise<OrderItemPayment[]> {
    const result = await this.pool.query(
      `SELECT * FROM order_item_payments
       WHERE order_item_id = $1
       ORDER BY created_at DESC`,
      [orderItemId]
    );
    
    return result.rows;
  }

  /**
   * Ödemeye göre sipariş öğesi ödemelerini getirir
   */
  async findByPaymentId(paymentId: number): Promise<OrderItemPayment[]> {
    const result = await this.pool.query(
      `SELECT * FROM order_item_payments
       WHERE payment_id = $1
       ORDER BY created_at DESC`,
      [paymentId]
    );
    
    return result.rows;
  }

  /**
   * Sipariş öğesinin ödenmiş miktarını hesaplar
   */
  async getPaidQuantity(orderItemId: number): Promise<number> {
    const result = await this.pool.query(
      `SELECT COALESCE(SUM(paid_quantity), 0) as total_paid
       FROM order_item_payments
       WHERE order_item_id = $1`,
      [orderItemId]
    );
    
    return parseFloat(result.rows[0].total_paid) || 0;
  }

  /**
   * Sipariş öğesinin ödenebilir maksimum miktarını hesaplar
   */
  async getMaxPayableQuantity(orderItemId: number): Promise<number> {
    // Önce sipariş öğesinin toplam miktarını bul
    const itemResult = await this.pool.query(
      `SELECT quantity FROM order_items WHERE id = $1`,
      [orderItemId]
    );
    
    if (itemResult.rows.length === 0) {
      return 0;
    }
    
    const totalQuantity = parseInt(itemResult.rows[0].quantity);
    
    // Daha sonra zaten ödenmiş miktarı bul
    const paidQuantity = await this.getPaidQuantity(orderItemId);
    
    // Ödenebilir maksimum miktar = toplam miktar - ödenmiş miktar
    return Math.max(0, totalQuantity - paidQuantity);
  }
}

export default new OrderItemPaymentModel(); 