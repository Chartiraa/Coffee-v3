import { Pool } from 'pg';
import db from '../config/database';
import OrderModel from './order.model';

export interface TablePayment {
  id: number;
  table_id: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  discount_amount: number;
  status: 'active' | 'closed' | 'cancelled';
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTablePaymentDTO {
  table_id: number;
  status?: 'active' | 'closed' | 'cancelled';
}

class TablePaymentModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  /**
   * Masa için aktif bir ödeme kaydı oluşturur
   */
  async createForTable(tableId: number, userId: number): Promise<TablePayment> {
    const result = await this.pool.query(
      `INSERT INTO table_payments
       (table_id, status, user_id)
       VALUES ($1, 'active', $2)
       RETURNING *`,
      [tableId, userId]
    );
    
    return result.rows[0];
  }

  /**
   * Bir masa için aktif ödeme kaydını bulur
   */
  async findActiveByTableId(tableId: number): Promise<TablePayment | null> {
    const result = await this.pool.query(
      `SELECT * FROM table_payments
       WHERE table_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [tableId]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Tüm masa ödeme kayıtlarını getirir
   */
  async findAll(status?: 'active' | 'closed' | 'cancelled'): Promise<TablePayment[]> {
    let query = 'SELECT * FROM table_payments';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Bir masa ödemesini kapatır
   */
  async closeTablePayment(id: number, userId: number): Promise<TablePayment | null> {
    // Önce kaydı kontrol et
    const tablePayment = await this.findById(id);
    if (!tablePayment) {
      return null;
    }
    
    // Kalan tutar kontrolü
    if (tablePayment.remaining_amount > 0) {
      throw new Error(`Bu masanın ${tablePayment.remaining_amount} tutarında ödenmemiş bakiyesi var`);
    }
    
    // Ödeme kaydını kapat
    const result = await this.pool.query(
      `UPDATE table_payments
       SET status = 'closed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    return result.rows[0];
  }

  /**
   * Ödeme kaydını ID'ye göre bulur
   */
  async findById(id: number): Promise<TablePayment | null> {
    const result = await this.pool.query(
      'SELECT * FROM table_payments WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Masa ödeme tutarlarını manuel olarak günceller
   */
  async updateAmounts(id: number): Promise<TablePayment | null> {
    await this.pool.query('SELECT update_table_payment_amounts($1)', [id]);
    
    return this.findById(id);
  }

  /**
   * Masa ödemesine indirim uygular
   */
  async applyDiscount(id: number, discountAmount: number): Promise<TablePayment | null> {
    // Önce kaydı kontrol et
    const tablePayment = await this.findById(id);
    if (!tablePayment) {
      return null;
    }
    
    // İndirim tutarı geçerli mi?
    if (discountAmount <= 0 || discountAmount > tablePayment.remaining_amount) {
      throw new Error('Geçersiz indirim tutarı');
    }
    
    // İndirimi uygula
    const result = await this.pool.query(
      `UPDATE table_payments
       SET discount_amount = discount_amount + $2,
           remaining_amount = remaining_amount - $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, discountAmount]
    );
    
    return result.rows[0];
  }
}

export default new TablePaymentModel(); 