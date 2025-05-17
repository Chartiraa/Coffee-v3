import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import CategoryController from '../controllers/category.controller';
import ProductController from '../controllers/product.controller';
import ProductOptionController from '../controllers/product-option.controller';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

// Debug için route'ları logla
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] Menu Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Kategori route'ları
router.get('/categories', CategoryController.getAll as RequestHandler);
router.get('/categories/active', CategoryController.getActive as RequestHandler);
router.get('/categories/:id', CategoryController.getById as RequestHandler);
router.post('/categories', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, CategoryController.create as RequestHandler);
router.put('/categories/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, CategoryController.update as RequestHandler);
router.delete('/categories/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, CategoryController.delete as RequestHandler);

// Ürün route'ları
router.get('/products', ProductController.getAll as RequestHandler);
router.get('/products/active', ProductController.getActive as RequestHandler);
router.get('/products/:id', ProductController.getById as RequestHandler);
router.get('/categories/:categoryId/products', ProductController.getByCategory as RequestHandler);
router.post('/products', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductController.create as RequestHandler);
router.put('/products/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductController.update as RequestHandler);
router.delete('/products/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductController.delete as RequestHandler);
router.patch('/products/:id/availability', authenticate as RequestHandler, authorize('admin', 'manager', 'barista') as RequestHandler, ProductController.updateAvailability as RequestHandler);

// Ürün seçenekleri route'ları
router.get('/products/:id/options', ProductController.getProductOptions as RequestHandler);
router.post('/products/:id/options', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductController.addProductOption as RequestHandler);
router.delete('/products/:id/options/:optionId', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductController.removeProductOption as RequestHandler);

// Seçenek kategorileri route'ları
router.get('/options', ProductOptionController.getAllOptions as RequestHandler);
router.get('/options/:id', ProductOptionController.getOptionById as RequestHandler);
router.post('/options', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductOptionController.createOption as RequestHandler);
router.put('/options/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductOptionController.updateOption as RequestHandler);
router.delete('/options/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductOptionController.deleteOption as RequestHandler);

// Seçenek değerleri route'ları
router.get('/options/:optionId/values', ProductOptionController.getOptionValues as RequestHandler);
router.get('/values/:id', ProductOptionController.getOptionValueById as RequestHandler);
router.post('/options/:optionId/values', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductOptionController.createOptionValue as RequestHandler);
router.put('/values/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductOptionController.updateOptionValue as RequestHandler);
router.delete('/values/:id', authenticate as RequestHandler, authorize('admin', 'manager') as RequestHandler, ProductOptionController.deleteOptionValue as RequestHandler);

export default router; 