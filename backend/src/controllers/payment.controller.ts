import { Request, Response } from 'express';
import { User } from '../models/user.model';
import PaymentModel, {
  CreatePaymentDTO,
  CreateCashRegisterTransactionDTO
} from '../models/payment.model';
import OrderModel from '../models/order.model';
import TablePaymentModel from '../models/table-payment.model';
import OrderItemPaymentModel from '../models/order-item-payment.model';

interface AuthenticatedRequest extends Request {
  user?: User;
}

class PaymentController {
  constructor() {
    this.createPayment = this.createPayment.bind(this);
    this.getPaymentsByOrderId = this.getPaymentsByOrderId.bind(this);
    this.getPaymentsByTableId = this.getPaymentsByTableId.bind(this);
    this.getPaymentDetails = this.getPaymentDetails.bind(this);
    this.refundPayment = this.refundPayment.bind(this);
    this.getOrderItemsPaymentStatus = this.getOrderItemsPaymentStatus.bind(this);
    this.getTableItemsPaymentStatus = this.getTableItemsPaymentStatus.bind(this);
    this.getActiveTablePayment = this.getActiveTablePayment.bind(this);
    this.closeTablePayment = this.closeTablePayment.bind(this);
    this.applyTableDiscount = this.applyTableDiscount.bind(this);
    this.getCashRegisterBalance = this.getCashRegisterBalance.bind(this);
    this.openCashRegister = this.openCashRegister.bind(this);
    this.closeCashRegister = this.closeCashRegister.bind(this);
    this.createCashRegisterTransaction = this.createCashRegisterTransaction.bind(this);
    this.getCashRegisterTransactions = this.getCashRegisterTransactions.bind(this);
    this.getDailySalesReport = this.getDailySalesReport.bind(this);
    this.getSalesReport = this.getSalesReport.bind(this);
    this.getRecentPayments = this.getRecentPayments.bind(this);
  }

  async createPayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'cashier'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const paymentData: CreatePaymentDTO = req.body;

      // Temel veri doğrulama
      if (!paymentData.amount || paymentData.amount <= 0) {
        return res.status(400).json({ error: 'Geçerli bir ödeme tutarı gerekli' });
      }

      if (!paymentData.payment_method && !paymentData.is_complimentary) {
        return res.status(400).json({ error: 'Ödeme yöntemi gerekli' });
      }
      
      // Sipariş veya masa ID'si gerekli
      if (!paymentData.order_id && !paymentData.table_id) {
        return res.status(400).json({ error: 'Sipariş ID veya Masa ID gerekli' });
      }

      // İndirim doğrulama
      if (paymentData.discount_amount && paymentData.discount_amount > 0) {
        if (!paymentData.discount_reason) {
          return res.status(400).json({ error: 'İndirim nedeni belirtilmelidir' });
        }
        
        if (!['admin', 'manager'].includes(req.user.role)) {
          return res.status(403).json({ error: 'İndirim uygulamak için yeterli yetkiniz yok' });
        }
      }
      
      // İkram doğrulama
      if (paymentData.is_complimentary === true) {
        if (!paymentData.complimentary_reason) {
          return res.status(400).json({ error: 'İkram nedeni belirtilmelidir' });
        }
        
        if (!['admin', 'manager'].includes(req.user.role)) {
          return res.status(403).json({ error: 'İkram etmek için yeterli yetkiniz yok' });
        }
      }

      // Sipariş tabanlı ödeme ise sipariş kontrolü yap
      if (paymentData.order_id) {
        const order = await OrderModel.findById(paymentData.order_id);
        if (!order) {
          return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        
        if (order.status === 'completed' || order.status === 'cancelled') {
          return res.status(400).json({ error: `Bu sipariş zaten ${order.status === 'completed' ? 'tamamlanmış' : 'iptal edilmiş'}` });
        }
      }
      
      // Masa tabanlı ödeme ise masa kontrolü yap
      if (paymentData.table_id) {
        // Masa için ödeme kaydı var mı kontrol et
        const tablePayment = await TablePaymentModel.findActiveByTableId(paymentData.table_id);
        
        // Ürün bazlı ödeme yapılacaksa, öğelerin kontrolü
        if (paymentData.order_items && paymentData.order_items.length > 0) {
          // Her bir öğe için ödenebilir miktar kontrolü yapılacak
          // (Bu kontrol artık payment.model içinde yapılıyor)
        }
      }

      const payment = await PaymentModel.createPayment(paymentData, req.user.id);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Ödeme oluşturulurken bir hata oluştu' });
      }
    }
  }

  async getPaymentsByOrderId(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Geçersiz sipariş ID' });
      }

      const payments = await PaymentModel.getPaymentsByOrderId(orderId);
      res.json(payments);
    } catch (error) {
      console.error(`Error getting payments for order ${req.params.orderId}:`, error);
      res.status(500).json({ error: 'Ödemeler getirilirken bir hata oluştu' });
    }
  }

  async getPaymentsByTableId(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const tableId = parseInt(req.params.tableId);
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Geçersiz masa ID' });
      }

      const payments = await PaymentModel.getPaymentsByTableId(tableId);
      res.json(payments);
    } catch (error) {
      console.error(`Error getting payments for table ${req.params.tableId}:`, error);
      res.status(500).json({ error: 'Masa ödemeleri getirilirken bir hata oluştu' });
    }
  }

  async getPaymentDetails(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ error: 'Geçersiz ödeme ID' });
      }

      const payment = await PaymentModel.getPaymentDetails(paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Ödeme bulunamadı' });
      }

      res.json(payment);
    } catch (error) {
      console.error(`Error getting payment details for ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Ödeme detayları getirilirken bir hata oluştu' });
    }
  }

  async getOrderItemsPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Geçersiz sipariş ID' });
      }

      const items = await PaymentModel.getOrderItemsPaymentStatus(orderId);
      res.json(items);
    } catch (error) {
      console.error(`Error getting payment status for order ${req.params.orderId}:`, error);
      res.status(500).json({ error: 'Sipariş ödeme durumu getirilirken bir hata oluştu' });
    }
  }

  async getTableItemsPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const tableId = parseInt(req.params.tableId);
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Geçersiz masa ID' });
      }

      const items = await PaymentModel.getTableItemsPaymentStatus(tableId);
      res.json(items);
    } catch (error) {
      console.error(`Error getting payment status for table ${req.params.tableId}:`, error);
      res.status(500).json({ error: 'Masa ödeme durumu getirilirken bir hata oluştu' });
    }
  }

  async getActiveTablePayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const tableId = parseInt(req.params.tableId);
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Geçersiz masa ID' });
      }

      const tablePayment = await TablePaymentModel.findActiveByTableId(tableId);
      if (!tablePayment) {
        // Aktif bir masa ödemesi yoksa yeni bir tane oluştur
        const newTablePayment = await TablePaymentModel.createForTable(tableId, req.user.id);
        res.json(newTablePayment);
      } else {
        // Varsa mevcut olanı döndür
        res.json(tablePayment);
      }
    } catch (error) {
      console.error(`Error getting active table payment for table ${req.params.tableId}:`, error);
      res.status(500).json({ error: 'Masa ödeme bilgisi getirilirken bir hata oluştu' });
    }
  }

  async closeTablePayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'cashier'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const tablePaymentId = parseInt(req.params.id);
      if (isNaN(tablePaymentId)) {
        return res.status(400).json({ error: 'Geçersiz masa ödeme ID' });
      }

      try {
        const closedTablePayment = await TablePaymentModel.closeTablePayment(tablePaymentId, req.user.id);
        if (!closedTablePayment) {
          return res.status(404).json({ error: 'Masa ödeme kaydı bulunamadı' });
        }
        
        res.json(closedTablePayment);
      } catch (error) {
        if (error instanceof Error) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error closing table payment ${req.params.id}:`, error);
      res.status(500).json({ error: 'Masa ödemesi kapatılırken bir hata oluştu' });
    }
  }

  async applyTableDiscount(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const tablePaymentId = parseInt(req.params.id);
      if (isNaN(tablePaymentId)) {
        return res.status(400).json({ error: 'Geçersiz masa ödeme ID' });
      }

      const { discountAmount } = req.body;
      if (!discountAmount || isNaN(parseFloat(discountAmount)) || parseFloat(discountAmount) <= 0) {
        return res.status(400).json({ error: 'Geçerli bir indirim tutarı gerekli' });
      }

      try {
        const updatedTablePayment = await TablePaymentModel.applyDiscount(
          tablePaymentId, 
          parseFloat(discountAmount)
        );
        
        if (!updatedTablePayment) {
          return res.status(404).json({ error: 'Masa ödeme kaydı bulunamadı' });
        }
        
        res.json(updatedTablePayment);
      } catch (error) {
        if (error instanceof Error) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error applying discount to table payment ${req.params.id}:`, error);
      res.status(500).json({ error: 'Masa ödemesine indirim uygulanırken bir hata oluştu' });
    }
  }

  async refundPayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ error: 'Geçersiz ödeme ID' });
      }

      const { notes } = req.body;

      const refundedPayment = await PaymentModel.refundPayment(paymentId, req.user.id, notes);
      
      if (!refundedPayment) {
        return res.status(404).json({ error: 'Ödeme bulunamadı veya iade edilemez' });
      }

      res.json(refundedPayment);
    } catch (error) {
      console.error(`Error refunding payment ${req.params.id}:`, error);
      res.status(500).json({ error: 'Ödeme iade edilirken bir hata oluştu' });
    }
  }

  async getCashRegisterBalance(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'cashier'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const balance = await PaymentModel.getCashRegisterBalance();
      res.json(balance);
    } catch (error) {
      console.error('Error getting cash register balance:', error);
      res.status(500).json({ error: 'Kasa bakiyesi getirilirken bir hata oluştu' });
    }
  }

  async openCashRegister(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'cashier'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const { opening_balance, notes } = req.body;
      
      if (opening_balance === undefined || opening_balance < 0) {
        return res.status(400).json({ error: 'Geçerli bir açılış bakiyesi gerekli' });
      }

      const transaction = await PaymentModel.openCashRegister(opening_balance, req.user.id, notes);
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error opening cash register:', error);
      
      // Özel hata mesajları
      if (error instanceof Error && error.message === 'Kasa zaten açık') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Kasa açılırken bir hata oluştu' });
    }
  }

  async closeCashRegister(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'cashier'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const { notes } = req.body;

      const transaction = await PaymentModel.closeCashRegister(req.user.id, notes);
      res.json(transaction);
    } catch (error) {
      console.error('Error closing cash register:', error);
      
      // Özel hata mesajları
      if (error instanceof Error && error.message === 'Kasa zaten kapalı') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Kasa kapatılırken bir hata oluştu' });
    }
  }

  async createCashRegisterTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const transactionData: CreateCashRegisterTransactionDTO = req.body;

      // Veri doğrulama
      if (!transactionData.transaction_type) {
        return res.status(400).json({ error: 'İşlem türü gerekli' });
      }

      // Geçerli işlem türleri
      const validTypes = ['deposit', 'withdrawal', 'correction', 'expense'];
      if (!validTypes.includes(transactionData.transaction_type)) {
        return res.status(400).json({ error: 'Geçersiz işlem türü' });
      }

      if (transactionData.amount === undefined) {
        return res.status(400).json({ error: 'Tutar gerekli' });
      }

      // Kasa açık mı kontrol et
      const status = await PaymentModel.getCashRegisterBalance();
      if (!status.cash_register_open) {
        return res.status(400).json({ error: 'İşlem yapabilmek için kasa açık olmalıdır' });
      }

      const transaction = await PaymentModel.createCashRegisterTransaction(transactionData, req.user.id);
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error creating cash register transaction:', error);
      res.status(500).json({ error: 'Kasa işlemi oluşturulurken bir hata oluştu' });
    }
  }

  async getCashRegisterTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'cashier'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }

      const transactions = await PaymentModel.getCashRegisterTransactions(startDate, endDate);
      res.json(transactions);
    } catch (error) {
      console.error('Error getting cash register transactions:', error);
      res.status(500).json({ error: 'Kasa işlemleri getirilirken bir hata oluştu' });
    }
  }

  async getDailySalesReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const report = await PaymentModel.getDailySalesReport(new Date(date));
      res.json(report);
    } catch (error) {
      console.error('Günlük satış raporu oluşturulurken hata:', error);
      res.status(500).json({ error: 'Günlük satış raporu oluşturulurken bir hata oluştu' });
    }
  }

  async getSalesReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Başlangıç ve bitiş tarihi gereklidir' });
      }

      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);
      endDate.setHours(23, 59, 59, 999);

      const report = await PaymentModel.getSalesReport(startDate, endDate);
      res.json(report);
    } catch (error) {
      console.error('Satış raporu oluşturulurken hata:', error);
      res.status(500).json({ error: 'Satış raporu oluşturulurken bir hata oluştu' });
    }
  }

  async getRecentPayments(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      let startDate: string | undefined;
      let endDate: string | undefined;

      console.log('Backend - Gelen istek parametreleri:', {
        limit,
        rawStartDate: req.query.startDate,
        rawEndDate: req.query.endDate
      });

      if (req.query.startDate && req.query.endDate) {
        // Tarihleri YYYY-MM-DD formatında gönder
        startDate = new Date(req.query.startDate as string).toISOString().split('T')[0];
        endDate = new Date(req.query.endDate as string).toISOString().split('T')[0];

        console.log('Backend - İşlenmiş tarih parametreleri:', {
          startDate,
          endDate
        });
      }

      console.log('Backend - PaymentModel.getRecentPayments çağrılıyor:', {
        limit,
        startDate,
        endDate
      });

      const payments = await PaymentModel.getRecentPayments(limit, startDate, endDate);
      
      console.log('Backend - Dönen ödeme sayısı:', payments.length);
      console.log('Backend - İlk ödeme örneği:', payments[0]);

      res.json(payments);
    } catch (error) {
      console.error('Backend - Son ödemeler getirilirken hata:', error);
      res.status(500).json({ error: 'Son ödemeler getirilirken bir hata oluştu' });
    }
  }
}

export default new PaymentController(); 