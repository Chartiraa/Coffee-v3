import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import InventoryController from '../controllers/inventory.controller';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

// Debug için route'ları logla
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] Inventory Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Stok öğeleri route'ları
router.get('/', authenticate as RequestHandler, InventoryController.getAllItems as RequestHandler);
router.get('/categories', authenticate as RequestHandler, InventoryController.getItemCategories as RequestHandler);
router.get('/low-stock', authenticate as RequestHandler, InventoryController.getLowStockItems as RequestHandler);
router.get('/transactions', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, InventoryController.getTransactions as RequestHandler);
router.get('/:id', authenticate as RequestHandler, InventoryController.getItemById as RequestHandler);
router.post('/', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, InventoryController.createItem as RequestHandler);
router.put('/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, InventoryController.updateItem as RequestHandler);
router.patch('/:id/quantity', authenticate as RequestHandler, authorize('admin', 'manager', 'barista') as RequestHandler, InventoryController.adjustQuantity as RequestHandler);

export default router; 