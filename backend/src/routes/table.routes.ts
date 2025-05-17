import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import TableController from '../controllers/table.controller';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

// Debug için route'ları logla
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] Table Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Masa route'ları
router.get('/', TableController.getAll as RequestHandler);
router.get('/:id', TableController.getById as RequestHandler);
router.post('/', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, TableController.create as RequestHandler);
router.put('/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, TableController.update as RequestHandler);
router.delete('/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, TableController.delete as RequestHandler);

// Masa durumu güncelleme endpoint'i - artık özel bir controller kullanıyoruz
router.patch('/:id/status', authenticate as RequestHandler, authorize('admin', 'manager', 'waiter', 'cashier', 'barista') as RequestHandler, TableController.updateStatus as RequestHandler);

export default router; 