import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import OrderController from '../controllers/order.controller';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

// Debug için route'ları logla
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] Order Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Sipariş route'ları
router.get('/', authenticate as RequestHandler, OrderController.getAll as RequestHandler);
router.get('/:id', authenticate as RequestHandler, OrderController.getById as RequestHandler);
router.get('/table/:tableId', authenticate as RequestHandler, OrderController.getByTableId as RequestHandler);
router.post('/', authenticate as RequestHandler, authorize('admin', 'manager', 'waiter') as RequestHandler, OrderController.create as RequestHandler);
router.put('/:id', authenticate as RequestHandler, authorize('admin', 'manager', 'waiter') as RequestHandler, OrderController.update as RequestHandler);
router.patch('/:id/status', authenticate as RequestHandler, OrderController.updateStatus as RequestHandler);
router.delete('/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, OrderController.cancelOrder as RequestHandler);

export default router; 