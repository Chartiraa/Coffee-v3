import { Pool } from 'pg';
import db from '../config/database';
import OrderItemPaymentModel, { CreateOrderItemPaymentDTO } from './order-item-payment.model';
import TablePaymentModel from './table-payment.model';
import OrderModel from './order.model';

export interface Payment {
  id: number;
  order_id: number;
  table_payment_id?: number; // Masa bazlı ödeme için eklendi
  amount: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'gift_card' | 'mobile';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference_number?: string;
  notes?: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  discount_amount?: number;
  discount_reason?: string;
  is_complimentary?: boolean;
  complimentary_reason?: string;
}

export interface CreatePaymentDTO {
  order_id: number; // Artık opsiyonel
  table_id?: number; // Masa ID'si eklenebilir
  amount: number;
  payment_method: Payment['payment_method'];
  reference_number?: string;
  notes?: string;
  discount_amount?: number;
  discount_reason?: string;
  is_complimentary?: boolean;
  complimentary_reason?: string;
  // Ürün bazlı ödeme için alanlar
  order_items?: {
    order_item_id: number;
    paid_quantity: number;
  }[];
}

export interface CashRegisterTransaction {
  id: number;
  transaction_type: 'opening' | 'closing' | 'sale' | 'expense' | 'deposit' | 'withdrawal' | 'correction' | 'discount' | 'complimentary';
  amount: number;
  payment_id?: number;
  notes?: string;
  user_id: number;
  created_at: Date;
}

export interface CashRegisterBalance {
  current_balance: number;
  total_sales: number;
  total_expenses: number;
  total_deposits: number;
  total_withdrawals: number;
  total_corrections: number;
  opening_balance: number;
  cash_register_open: boolean;
  last_opened_at?: Date;
  last_closed_at?: Date;
}

export interface CreateCashRegisterTransactionDTO {
  transaction_type: CashRegisterTransaction['transaction_type'];
  amount: number;
  payment_id?: number;
  notes?: string;
}

export interface DailySalesReport {
  date: string;
  total_sales: number;
  total_orders: number;
  total_discounts: number;
  total_complimentary: number;
  payment_methods: {
    payment_method: string;
    count: number;
    amount: number;
  }[];
}

export interface PaymentWithItemDetails extends Payment {
  item_payments?: any[];
}

export interface SalesReport {
  start_date: string;
  end_date: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  payment_methods: {
    payment_method: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  top_products: {
    product_id: number;
    product_name: string;
    quantity: number;
    total_sales: number;
    average_price: number;
  }[];
  hourly_sales: {
    hour: number;
    total_sales: number;
    order_count: number;
  }[];
  payments: {
    id: number;
    order_id: number;
    amount: number;
    payment_method: string;
    status: string;
    created_at: Date;
    user_id: number;
    user_name: string;
  }[];
}

class PaymentModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  /**
   * Bir ödeme kaydı oluşturur
   */
  async createPayment(paymentData: CreatePaymentDTO, userId: number): Promise<PaymentWithItemDetails> {
    // Başlat
    await this.pool.query('BEGIN');
    
    try {
      console.log('Ödeme verisi:', paymentData);
      let tablePaymentId = null;
      
      // Eğer masa ID'si verilmişse, ilgili aktif masa ödeme kaydını bul
      if (paymentData.table_id) {
        const tablePayment = await TablePaymentModel.findActiveByTableId(paymentData.table_id);
        
        if (tablePayment) {
          tablePaymentId = tablePayment.id;
        } else {
          // Eğer aktif bir masa ödeme kaydı yoksa, yeni bir tane oluştur
          const newTablePayment = await TablePaymentModel.createForTable(paymentData.table_id, userId);
          tablePaymentId = newTablePayment.id;
        }
      }
      
      // Ödeme kaydını oluştur
      const result = await this.pool.query(
        `INSERT INTO payments
         (order_id, table_payment_id, amount, payment_method, status, 
          reference_number, notes, user_id, discount_amount, discount_reason,
          is_complimentary, complimentary_reason)
         VALUES ($1, $2, $3, $4, 'completed', $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          paymentData.order_id || null,
          tablePaymentId,
          paymentData.amount,
          paymentData.payment_method,
          paymentData.reference_number || null,
          paymentData.notes || null,
          userId,
          paymentData.discount_amount || null,
          paymentData.discount_reason || null,
          paymentData.is_complimentary || false,
          paymentData.complimentary_reason || null
        ]
      );
      
      const payment: PaymentWithItemDetails = result.rows[0];
      console.log('Oluşturulan ödeme:', payment);
      
      // Kasa işlemi ekle
      await this.pool.query(
        `INSERT INTO cash_register_transactions
         (transaction_type, amount, payment_id, notes, user_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          payment.is_complimentary ? 'complimentary' : 'sale',
          payment.amount,
          payment.id,
          `Ödeme #${payment.id}${payment.order_id ? ` - Sipariş #${payment.order_id}` : ''}`,
          userId
        ]
      );
      
      // Sipariş öğesi ödemeleri ekle
      if (paymentData.order_items && paymentData.order_items.length > 0) {
        console.log('Ödeme öğeleri işleniyor:', paymentData.order_items);
        const itemPayments = [];
        
        for (const item of paymentData.order_items) {
          console.log('İşlenen öğe:', item);
          // Sipariş öğesini bul ve fiyatını al
          const orderItemResult = await this.pool.query(
            `SELECT product_price, quantity FROM order_items WHERE id = $1`,
            [item.order_item_id]
          );
          
          if (orderItemResult.rows.length === 0) {
            console.error(`Sipariş öğesi bulunamadı: ${item.order_item_id}`);
            throw new Error(`Sipariş öğesi bulunamadı: ${item.order_item_id}`);
          }
          
          const orderItem = orderItemResult.rows[0];
          console.log('Bulunan sipariş öğesi:', orderItem);
          
          // Maksimum ödenebilir miktarı kontrol et
          const maxPayable = await OrderItemPaymentModel.getMaxPayableQuantity(item.order_item_id);
          console.log('Maksimum ödenebilir miktar:', maxPayable);
          if (item.paid_quantity > maxPayable) {
            console.error(`Ödeme miktarı aşımı: ${item.paid_quantity} > ${maxPayable}`);
            throw new Error(`Ödeme miktarı maksimum ödenebilir miktarı aşıyor: ${item.paid_quantity} > ${maxPayable}`);
          }
          
          // Öğe başına ödeme tutarını hesapla
          const itemAmount = orderItem.product_price * item.paid_quantity;
          
          // Sipariş öğesi ödemesi oluştur
          const itemPaymentData: CreateOrderItemPaymentDTO = {
            order_item_id: item.order_item_id,
            payment_id: payment.id,
            paid_quantity: item.paid_quantity,
            amount: itemAmount
          };
          
          console.log('Oluşturulacak ödeme öğesi:', itemPaymentData);
          const itemPayment = await OrderItemPaymentModel.create(itemPaymentData);
          console.log('Oluşturulan ödeme öğesi:', itemPayment);
          itemPayments.push(itemPayment);
        }
        
        payment.item_payments = itemPayments;
      } else {
        console.log('Ödeme öğeleri yok veya boş');
      }
      
      // Eğer masa ödemesi varsa, tutarları güncelle
      if (tablePaymentId) {
        await TablePaymentModel.updateAmounts(tablePaymentId);
      }
      
      // İşlemi sonlandır
      await this.pool.query('COMMIT');
      
      return payment;
    } catch (error) {
      // Hata durumunda işlemi geri al
      await this.pool.query('ROLLBACK');
      console.error('Ödeme oluşturma hatası:', error);
      throw error;
    }
  }

  /**
   * Bir ID'ye göre ödeme kaydını getirir
   */
  async getPaymentById(id: number): Promise<Payment | null> {
    const result = await this.pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Sipariş ID'sine göre ödemeleri getirir
   */
  async getPaymentsByOrderId(orderId: number): Promise<Payment[]> {
    const result = await this.pool.query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );
    
    return result.rows;
  }

  /**
   * Masa ID'sine göre tüm ödemeleri getirir
   */
  async getPaymentsByTableId(tableId: number): Promise<Payment[]> {
    const result = await this.pool.query(
      `SELECT p.* FROM payments p
       JOIN table_payments tp ON p.table_payment_id = tp.id
       WHERE tp.table_id = $1
       ORDER BY p.created_at DESC`,
      [tableId]
    );
    
    return result.rows;
  }
  
  /**
   * Ödemeyi ve ilgili verileri ayrıntılı olarak getirir
   */
  async getPaymentDetails(id: number): Promise<PaymentWithItemDetails | null> {
    // Önce ödeme kaydını getir
    const payment = await this.getPaymentById(id);
    if (!payment) {
      return null;
    }
    
    // Sonra sipariş öğesi ödemelerini getir
    const itemPaymentsResult = await this.pool.query(
      `SELECT oip.*, oi.product_name, oi.product_price, oi.quantity as total_quantity
       FROM order_item_payments oip
       JOIN order_items oi ON oip.order_item_id = oi.id
       WHERE oip.payment_id = $1`,
      [id]
    );
    
    const paymentWithDetails: PaymentWithItemDetails = {
      ...payment,
      item_payments: itemPaymentsResult.rows
    };
    
    return paymentWithDetails;
  }

  // Diğer metodlar buraya...
  
  /**
   * Bir siparişteki tüm ürünlerin ödeme durumunu getirir
   */
  async getOrderItemsPaymentStatus(orderId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
         oi.id as order_item_id,
         oi.product_name,
         oi.quantity as total_quantity,
         COALESCE(SUM(oip.paid_quantity), 0) as paid_quantity,
         oi.quantity - COALESCE(SUM(oip.paid_quantity), 0) as remaining_quantity
       FROM order_items oi
       LEFT JOIN order_item_payments oip ON oi.id = oip.order_item_id
       WHERE oi.order_id = $1
       GROUP BY oi.id, oi.product_name, oi.quantity
       ORDER BY oi.id`,
      [orderId]
    );
    
    return result.rows;
  }

  /**
   * Bir masadaki tüm ürünlerin ödeme durumunu getirir
   */
  async getTableItemsPaymentStatus(tableId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
         oi.id as order_item_id,
         o.id as order_id,
         oi.product_name,
         oi.quantity as total_quantity,
         COALESCE(SUM(oip.paid_quantity), 0) as paid_quantity,
         oi.quantity - COALESCE(SUM(oip.paid_quantity), 0) as remaining_quantity
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN order_item_payments oip ON oi.id = oip.order_item_id
       WHERE o.table_id = $1 AND o.status != 'cancelled'
       GROUP BY oi.id, o.id, oi.product_name, oi.quantity
       ORDER BY o.created_at, oi.id`,
      [tableId]
    );
    
    return result.rows;
  }

  async refundPayment(paymentId: number, userId: number, notes?: string): Promise<Payment | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Ödemeyi bul
      const payment = await this.getPaymentById(paymentId);
      if (!payment || payment.status !== 'completed') {
        await client.query('ROLLBACK');
        return null;
      }
      
      // Ödeme statüsünü güncelle
      const updateResult = await client.query(
        `UPDATE payments 
         SET status = 'refunded', notes = CASE WHEN notes IS NULL THEN $1 ELSE notes || E'\\n' || $1 END, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2
         RETURNING *`,
        [notes || 'İade edildi', paymentId]
      );
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      // Nakit ödemeyse kasa işlemi ekle (negatif)
      if (payment.payment_method === 'cash') {
        await client.query(
          `INSERT INTO cash_register_transactions
           (transaction_type, amount, payment_id, notes, user_id)
           VALUES ('expense', $1, $2, $3, $4)`,
          [
            -payment.amount, // Negatif değer
            payment.id,
            `Sipariş #${payment.order_id} için ödeme iadesi`,
            userId
          ]
        );
      }
      
      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createCashRegisterTransaction(transactionData: CreateCashRegisterTransactionDTO, userId: number): Promise<CashRegisterTransaction> {
    const result = await this.pool.query(
      `INSERT INTO cash_register_transactions 
       (transaction_type, amount, payment_id, notes, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        transactionData.transaction_type,
        transactionData.amount,
        transactionData.payment_id || null,
        transactionData.notes || null,
        userId
      ]
    );
    
    return result.rows[0];
  }

  async getCashRegisterBalance(): Promise<CashRegisterBalance> {
    const client = await this.pool.connect();
    
    try {
      const balanceQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN transaction_type = 'opening' THEN amount ELSE 0 END), 0) as opening_balance,
          COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END), 0) as total_sales,
          COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
          COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposits,
          COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals,
          COALESCE(SUM(CASE WHEN transaction_type = 'correction' THEN amount ELSE 0 END), 0) as total_corrections,
          COALESCE(SUM(amount), 0) as current_balance
        FROM cash_register_transactions
        WHERE (
          SELECT COUNT(*) FROM cash_register_transactions 
          WHERE transaction_type = 'closing'
        ) < (
          SELECT COUNT(*) FROM cash_register_transactions 
          WHERE transaction_type = 'opening'
        )
      `;
      
      const balanceResult = await client.query(balanceQuery);
      const balance = balanceResult.rows[0];
      
      // Kasa açık mı kontrol et
      const cashRegisterStatusQuery = `
        SELECT 
          (SELECT COUNT(*) FROM cash_register_transactions WHERE transaction_type = 'opening') > 
          (SELECT COUNT(*) FROM cash_register_transactions WHERE transaction_type = 'closing') as cash_register_open,
          (SELECT created_at FROM cash_register_transactions WHERE transaction_type = 'opening' ORDER BY created_at DESC LIMIT 1) as last_opened_at,
          (SELECT created_at FROM cash_register_transactions WHERE transaction_type = 'closing' ORDER BY created_at DESC LIMIT 1) as last_closed_at
      `;
      
      const statusResult = await client.query(cashRegisterStatusQuery);
      const status = statusResult.rows[0];
      
      return {
        current_balance: parseFloat(balance.current_balance) || 0,
        total_sales: parseFloat(balance.total_sales) || 0,
        total_expenses: parseFloat(balance.total_expenses) || 0,
        total_deposits: parseFloat(balance.total_deposits) || 0,
        total_withdrawals: parseFloat(balance.total_withdrawals) || 0,
        total_corrections: parseFloat(balance.total_corrections) || 0,
        opening_balance: parseFloat(balance.opening_balance) || 0,
        cash_register_open: status.cash_register_open,
        last_opened_at: status.last_opened_at,
        last_closed_at: status.last_closed_at
      };
    } finally {
      client.release();
    }
  }

  async openCashRegister(openingBalance: number, userId: number, notes?: string): Promise<CashRegisterTransaction> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Kasanın açık olup olmadığını kontrol et
      const status = await this.getCashRegisterBalance();
      if (status.cash_register_open) {
        throw new Error('Kasa zaten açık');
      }
      
      // Kasa açılış işlemini oluştur
      const result = await client.query(
        `INSERT INTO cash_register_transactions 
         (transaction_type, amount, notes, user_id)
         VALUES ('opening', $1, $2, $3)
         RETURNING *`,
        [
          openingBalance,
          notes || 'Kasa açılış bakiyesi',
          userId
        ]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async closeCashRegister(userId: number, notes?: string): Promise<CashRegisterTransaction> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Kasanın açık olup olmadığını kontrol et
      const status = await this.getCashRegisterBalance();
      if (!status.cash_register_open) {
        throw new Error('Kasa zaten kapalı');
      }
      
      // Kasa kapanış işlemini oluştur
      const result = await client.query(
        `INSERT INTO cash_register_transactions 
         (transaction_type, amount, notes, user_id)
         VALUES ('closing', $1, $2, $3)
         RETURNING *`,
        [
          0, // Kapanışta bakiye değişmez
          notes || `Kasa kapanış bakiyesi: ${status.current_balance}`,
          userId
        ]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getCashRegisterTransactions(startDate?: Date, endDate?: Date): Promise<CashRegisterTransaction[]> {
    let query = 'SELECT * FROM cash_register_transactions';
    const queryParams: any[] = [];
    let paramCount = 1;
    
    if (startDate) {
      query += ` WHERE created_at >= $${paramCount}`;
      queryParams.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      if (paramCount === 1) {
        query += ` WHERE created_at <= $${paramCount}`;
      } else {
        query += ` AND created_at <= $${paramCount}`;
      }
      queryParams.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, queryParams);
    return result.rows;
  }

  async getDailySalesReport(date?: Date): Promise<DailySalesReport> {
    const targetDate = date ? date : new Date();
    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    
    const client = await this.pool.connect();
    
    try {
      // Günlük toplam satış ve sipariş sayısı
      const salesQuery = `
        SELECT 
          COALESCE(SUM(amount), 0) as total_sales,
          COUNT(DISTINCT order_id) as total_orders,
          COALESCE(SUM(discount_amount), 0) as total_discounts,
          SUM(CASE WHEN is_complimentary = true THEN 1 ELSE 0 END) as total_complimentary
        FROM payments
        WHERE status = 'completed'
          AND DATE(created_at) = $1
      `;
      
      const salesResult = await client.query(salesQuery, [dateStr]);
      const sales = salesResult.rows[0];
      
      // Ödeme yöntemlerine göre dağılım
      const methodsQuery = `
        SELECT 
          payment_method,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM payments
        WHERE status = 'completed'
          AND DATE(created_at) = $1
        GROUP BY payment_method
      `;
      
      const methodsResult = await client.query(methodsQuery, [dateStr]);
      
      return {
        date: dateStr,
        total_sales: parseFloat(sales.total_sales) || 0,
        total_orders: parseInt(sales.total_orders) || 0,
        total_discounts: parseFloat(sales.total_discounts) || 0,
        total_complimentary: parseInt(sales.total_complimentary) || 0,
        payment_methods: methodsResult.rows.map(row => ({
          payment_method: row.payment_method,
          count: parseInt(row.count),
          amount: parseFloat(row.amount)
        }))
      };
    } finally {
      client.release();
    }
  }

  async getSalesReport(startDate: Date, endDate: Date): Promise<SalesReport> {
    try {
      // Ödemeleri getir
      const paymentsResult = await this.pool.query(
        `SELECT p.*, u.full_name as user_name
         FROM payments p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.created_at BETWEEN $1 AND $2
         AND p.status = 'completed'
         ORDER BY p.created_at ASC`,
        [startDate, endDate]
      );

      const payments = paymentsResult.rows;
      
      // Sayısal değerleri düzgün şekilde dönüştür
      const total_sales = parseFloat(payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2));
      const total_orders = payments.length;
      const average_order_value = total_orders > 0 ? parseFloat((total_sales / total_orders).toFixed(2)) : 0;

      // Ödeme yöntemlerine göre dağılım
      const paymentMethods = payments.reduce((acc: Record<string, { payment_method: string; count: number; amount: number }>, payment) => {
        const method = payment.payment_method;
        if (!acc[method]) {
          acc[method] = {
            payment_method: method,
            count: 0,
            amount: 0
          };
        }
        acc[method].count++;
        acc[method].amount += parseFloat(payment.amount);
        return acc;
      }, {});

      // Ödeme yöntemlerinin yüzdelerini hesapla
      const paymentMethodsWithPercentage = Object.values(paymentMethods).map(method => ({
        ...method,
        amount: parseFloat(method.amount.toFixed(2)),
        percentage: total_sales > 0 ? parseFloat(((method.amount / total_sales) * 100).toFixed(2)) : 0
      }));

      // En çok satan ürünleri getir
      const topProductsResult = await this.pool.query(
        `SELECT 
          oi.product_id,
          oi.product_name,
          COALESCE(SUM(oip.paid_quantity), 0) as quantity,
          COALESCE(SUM(oip.amount), 0) as total_amount,
          COALESCE(AVG(oi.product_price), 0) as average_price
         FROM order_items oi
         INNER JOIN order_item_payments oip ON oi.id = oip.order_item_id
         INNER JOIN payments p ON oip.payment_id = p.id
         WHERE p.created_at BETWEEN $1 AND $2
         AND p.status = 'completed'
         GROUP BY oi.product_id, oi.product_name
         HAVING COALESCE(SUM(oip.paid_quantity), 0) > 0
         ORDER BY quantity DESC
         LIMIT 10`,
        [startDate, endDate]
      );

      // Toplam ürün satışlarını düzgün formatta dönüştür
      const topProducts = topProductsResult.rows.map(product => ({
        product_id: parseInt(product.product_id) || 0,
        product_name: product.product_name || 'Bilinmeyen Ürün',
        quantity: parseInt(product.quantity) || 0,
        total_sales: parseFloat(product.total_amount) || 0,
        average_price: parseFloat(product.average_price) || 0
      }));

      // Saatlik satışları hesapla
      const hourlySales = Array.from({ length: 24 }, (_, hour) => {
        const hourPayments = payments.filter(p => new Date(p.created_at).getHours() === hour);
        const hourTotal = parseFloat(hourPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2));
        return {
          hour,
          total_sales: hourTotal,
          order_count: hourPayments.length
        };
      });

      return {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        total_sales,
        total_orders,
        average_order_value,
        payment_methods: paymentMethodsWithPercentage,
        top_products: topProducts,
        hourly_sales: hourlySales,
        payments: payments.map(payment => ({
          id: payment.id,
          order_id: payment.order_id,
          amount: parseFloat(payment.amount),
          payment_method: payment.payment_method,
          status: payment.status,
          created_at: payment.created_at,
          user_id: payment.user_id,
          user_name: payment.user_name
        }))
      };
    } catch (error) {
      console.error('Satış raporu oluşturulurken hata:', error);
      throw error;
    }
  }

  /**
   * Son ödemeleri getirir
   */
  async getRecentPayments(limit: number = 100, startDate?: string, endDate?: string): Promise<Payment[]> {
    try {
      console.log('Son ödemeler getiriliyor:', { limit, startDate, endDate });
      
      const params: any[] = [];
      let whereClause = 'WHERE p.status = \'completed\'';
      
      if (startDate && endDate) {
        // PostgreSQL timestamp formatını kullan
        whereClause += ' AND DATE(p.created_at) >= DATE($1) AND DATE(p.created_at) <= DATE($2)';
        params.push(startDate, endDate);
        
        console.log('Tarih aralığı:', { startDate, endDate });
      }
      
      const query = `
        SELECT DISTINCT
          p.*,
          u.full_name as user_name,
          COALESCE(o.table_id, tp.table_id) as table_id,
          COALESCE(t.name, 'Silinmiş Masa') as table_name,
          COALESCE(SUM(oip.amount), 0) as total_amount,
          COUNT(oip.id) as item_count
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN orders o ON p.order_id = o.id
        LEFT JOIN table_payments tp ON p.table_payment_id = tp.id
        LEFT JOIN tables t ON COALESCE(o.table_id, tp.table_id) = t.id
        LEFT JOIN order_item_payments oip ON p.id = oip.payment_id
        ${whereClause}
        GROUP BY 
          p.id, 
          p.order_id,
          p.amount,
          p.payment_method,
          p.status,
          p.created_at,
          p.updated_at,
          p.user_id,
          u.full_name,
          o.table_id,
          tp.table_id,
          t.name
        ORDER BY p.created_at DESC
        LIMIT $${params.length + 1}
      `;
      
      console.log('SQL Sorgusu:', query);
      console.log('Parametreler:', params);
      
      const result = await this.pool.query(query, [...params, limit]);
      
      console.log('Bulunan ödemeler:', result.rows.length);
      const mappedPayments = result.rows.map(row => ({
        id: row.id,
        order_id: row.order_id,
        table_payment_id: row.table_payment_id,
        amount: parseFloat(row.amount) || parseFloat(row.total_amount) || 0,
        payment_method: row.payment_method,
        status: row.status,
        reference_number: row.reference_number,
        notes: row.notes,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        discount_amount: row.discount_amount,
        discount_reason: row.discount_reason,
        is_complimentary: row.is_complimentary,
        complimentary_reason: row.complimentary_reason,
        user_name: row.user_name,
        table_id: row.table_id,
        table_name: row.table_name,
        table_number: parseInt(row.table_name?.replace('Masa ', '')) || 0
      }));
      
      console.log('İşlenmiş ödemeler:', mappedPayments);
      return mappedPayments;
    } catch (error) {
      console.error('Ödemeleri getirirken hata:', error);
      throw error;
    }
  }
}

export default new PaymentModel(); 