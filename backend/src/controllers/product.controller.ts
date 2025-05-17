import { Request, Response } from 'express';
import { User } from '../models/user.model';
import ProductModel, { CreateProductDTO, UpdateProductDTO } from '../models/product.model';
import ProductOptionModel from '../models/product-option.model';

interface AuthenticatedRequest extends Request {
  user?: User;
}

class ProductController {
  constructor() {
    this.getAll = this.getAll.bind(this);
    this.getActive = this.getActive.bind(this);
    this.getById = this.getById.bind(this);
    this.getByCategory = this.getByCategory.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.updateAvailability = this.updateAvailability.bind(this);
    this.getProductOptions = this.getProductOptions.bind(this);
    this.addProductOption = this.addProductOption.bind(this);
    this.removeProductOption = this.removeProductOption.bind(this);
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const products = await ProductModel.findAllWithCategory();
      res.json(products);
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({ error: 'Ürünleri getirirken bir hata oluştu' });
    }
  }

  async getActive(req: AuthenticatedRequest, res: Response) {
    try {
      const products = await ProductModel.findAllWithCategory(true, true);
      res.json(products);
    } catch (error) {
      console.error('Error getting active products:', error);
      res.status(500).json({ error: 'Aktif ürünleri getirirken bir hata oluştu' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz ürün ID' });
      }

      const product = await ProductModel.findWithCategory(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Ürün bulunamadı' });
      }

      // Ürün seçeneklerini de getir
      const options = await ProductOptionModel.findProductOptionsWithValuesByProductId(id);
      
      res.json({
        ...product,
        options
      });
    } catch (error) {
      console.error(`Error getting product with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Ürünü getirirken bir hata oluştu' });
    }
  }

  async getByCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: 'Geçersiz kategori ID' });
      }

      const activeOnly = req.query.activeOnly === 'true';
      const availableOnly = req.query.availableOnly === 'true';

      const products = await ProductModel.findAllWithCategory(activeOnly, availableOnly, categoryId);
      res.json(products);
    } catch (error) {
      console.error(`Error getting products for category ${req.params.categoryId}:`, error);
      res.status(500).json({ error: 'Kategori ürünlerini getirirken bir hata oluştu' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const productData: CreateProductDTO = req.body;

      // Basit doğrulama
      if (!productData.name || productData.name.trim() === '') {
        return res.status(400).json({ error: 'Ürün adı gerekli' });
      }

      if (!productData.category_id) {
        return res.status(400).json({ error: 'Kategori ID gerekli' });
      }

      if (productData.price === undefined || productData.price < 0) {
        return res.status(400).json({ error: 'Geçerli bir fiyat gerekli' });
      }

      const product = await ProductModel.create(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Ürün oluşturulurken bir hata oluştu' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz ürün ID' });
      }

      const productData: UpdateProductDTO = req.body;
      
      // Güncelleme için veri kontrolü
      if (Object.keys(productData).length === 0) {
        return res.status(400).json({ error: 'Güncellenecek veri girilmedi' });
      }

      // Fiyat doğrulaması
      if (productData.price !== undefined && productData.price < 0) {
        return res.status(400).json({ error: 'Fiyat 0\'dan küçük olamaz' });
      }

      const product = await ProductModel.update(id, productData);
      
      if (!product) {
        return res.status(404).json({ error: 'Ürün bulunamadı' });
      }

      res.json(product);
    } catch (error) {
      console.error(`Error updating product with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Ürün güncellenirken bir hata oluştu' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz ürün ID' });
      }

      const success = await ProductModel.delete(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Ürün bulunamadı' });
      }

      res.status(200).json({ message: 'Ürün başarıyla silindi' });
    } catch (error) {
      console.error(`Error deleting product with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Ürün silinirken bir hata oluştu' });
    }
  }

  async updateAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager', 'barista'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz ürün ID' });
      }

      const { is_available } = req.body;
      
      if (is_available === undefined) {
        return res.status(400).json({ error: 'Stok durumu belirtilmeli' });
      }

      const product = await ProductModel.updateAvailability(id, is_available);
      
      if (!product) {
        return res.status(404).json({ error: 'Ürün bulunamadı' });
      }

      res.json(product);
    } catch (error) {
      console.error(`Error updating product availability with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Ürün stok durumu güncellenirken bir hata oluştu' });
    }
  }

  async getProductOptions(req: AuthenticatedRequest, res: Response) {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: 'Geçersiz ürün ID' });
      }

      const options = await ProductOptionModel.findProductOptionsWithValuesByProductId(productId);
      res.json(options);
    } catch (error) {
      console.error(`Error getting options for product ${req.params.id}:`, error);
      res.status(500).json({ error: 'Ürün seçeneklerini getirirken bir hata oluştu' });
    }
  }

  async addProductOption(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: 'Geçersiz ürün ID' });
      }

      const { option_id, is_required } = req.body;
      
      if (!option_id) {
        return res.status(400).json({ error: 'Seçenek ID gerekli' });
      }

      const relation = await ProductOptionModel.createProductOptionRelation({
        product_id: productId,
        option_id,
        is_required
      });

      res.status(201).json(relation);
    } catch (error) {
      console.error(`Error adding option to product ${req.params.id}:`, error);
      if ((error as any).code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Bu seçenek zaten ürüne eklenmiş' });
      }
      res.status(500).json({ error: 'Ürüne seçenek eklerken bir hata oluştu' });
    }
  }

  async removeProductOption(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: 'Geçersiz ürün ID' });
      }

      const optionId = parseInt(req.params.optionId);
      if (isNaN(optionId)) {
        return res.status(400).json({ error: 'Geçersiz seçenek ID' });
      }

      const success = await ProductOptionModel.deleteProductOptionRelation(productId, optionId);
      
      if (!success) {
        return res.status(404).json({ error: 'Ürün-Seçenek ilişkisi bulunamadı' });
      }

      res.status(200).json({ message: 'Seçenek üründen kaldırıldı' });
    } catch (error) {
      console.error(`Error removing option ${req.params.optionId} from product ${req.params.id}:`, error);
      res.status(500).json({ error: 'Üründen seçenek kaldırırken bir hata oluştu' });
    }
  }
}

export default new ProductController(); 