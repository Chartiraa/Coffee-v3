import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import PaymentController from '../controllers/payment.controller';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

// Debug için route'ları logla
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] Payment Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Ödeme route'ları
router.post('/', authenticate as RequestHandler, authorize('admin', 'manager', 'cashier') as RequestHandler, PaymentController.createPayment as RequestHandler);
router.get('/recent', authenticate as RequestHandler, PaymentController.getRecentPayments as RequestHandler);
router.get('/order/:orderId', authenticate as RequestHandler, PaymentController.getPaymentsByOrderId as RequestHandler);
router.get('/order/:orderId/items-status', authenticate as RequestHandler, PaymentController.getOrderItemsPaymentStatus as RequestHandler);

// Masa bazlı ödeme endpoint'leri
router.get('/table/:tableId', authenticate as RequestHandler, PaymentController.getPaymentsByTableId as RequestHandler);
router.get('/table/:tableId/items-status', authenticate as RequestHandler, PaymentController.getTableItemsPaymentStatus as RequestHandler);
router.get('/table/:tableId/active-payment', authenticate as RequestHandler, PaymentController.getActiveTablePayment as RequestHandler);

// Masa ödeme işlemleri
router.post('/table-payment/:id/close', authenticate as RequestHandler, authorize('admin', 'manager', 'cashier') as RequestHandler, PaymentController.closeTablePayment as RequestHandler);
router.post('/table-payment/:id/discount', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, PaymentController.applyTableDiscount as RequestHandler);

// Ödeme detayı
router.get('/:id', authenticate as RequestHandler, PaymentController.getPaymentDetails as RequestHandler);

// Ödeme iadesi
router.post('/:id/refund', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, PaymentController.refundPayment as RequestHandler);

// Kasa route'ları
router.get('/cash-register/balance', authenticate as RequestHandler, authorize('admin', 'manager', 'cashier') as RequestHandler, PaymentController.getCashRegisterBalance as RequestHandler);
router.post('/cash-register/open', authenticate as RequestHandler, authorize('admin', 'manager', 'cashier') as RequestHandler, PaymentController.openCashRegister as RequestHandler);
router.post('/cash-register/close', authenticate as RequestHandler, authorize('admin', 'manager', 'cashier') as RequestHandler, PaymentController.closeCashRegister as RequestHandler);
router.post('/cash-register/transaction', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, PaymentController.createCashRegisterTransaction as RequestHandler);
router.get('/cash-register/transactions', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, PaymentController.getCashRegisterTransactions as RequestHandler);
router.get('/reports/daily-sales', authenticate as RequestHandler, authorize('admin', 'manager', 'cashier') as RequestHandler, PaymentController.getDailySalesReport as RequestHandler);
router.get('/reports/discounts', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, PaymentController.getCashRegisterTransactions as RequestHandler);
router.get('/reports/complimentary', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, PaymentController.getCashRegisterTransactions as RequestHandler);

// Satış raporu endpoint'i
router.get('/reports/sales-report', authenticate as RequestHandler, authorize('admin', 'manager', 'cashier') as RequestHandler, PaymentController.getSalesReport as RequestHandler);

export default router; 