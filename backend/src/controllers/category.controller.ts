import { Request, Response } from 'express';
import { User } from '../models/user.model';
import CategoryModel, { CreateCategoryDTO, UpdateCategoryDTO } from '../models/category.model';

interface AuthenticatedRequest extends Request {
  user?: User;
}

class CategoryController {
  constructor() {
    this.getAll = this.getAll.bind(this);
    this.getActive = this.getActive.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const categories = await CategoryModel.findAll();
      res.json(categories);
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({ error: 'Kategorileri getirirken bir hata oluştu' });
    }
  }

  async getActive(req: AuthenticatedRequest, res: Response) {
    try {
      const categories = await CategoryModel.findAll(true);
      res.json(categories);
    } catch (error) {
      console.error('Error getting active categories:', error);
      res.status(500).json({ error: 'Aktif kategorileri getirirken bir hata oluştu' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz kategori ID' });
      }

      const category = await CategoryModel.findById(id);
      
      if (!category) {
        return res.status(404).json({ error: 'Kategori bulunamadı' });
      }

      res.json(category);
    } catch (error) {
      console.error(`Error getting category with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Kategoriyi getirirken bir hata oluştu' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const categoryData: CreateCategoryDTO = req.body;

      // Basit doğrulama
      if (!categoryData.name || categoryData.name.trim() === '') {
        return res.status(400).json({ error: 'Kategori adı gerekli' });
      }

      const category = await CategoryModel.create(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Kategori oluşturulurken bir hata oluştu' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz kategori ID' });
      }

      const categoryData: UpdateCategoryDTO = req.body;
      
      // Güncelleme için veri kontrolü
      if (Object.keys(categoryData).length === 0) {
        return res.status(400).json({ error: 'Güncellenecek veri girilmedi' });
      }

      const category = await CategoryModel.update(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ error: 'Kategori bulunamadı' });
      }

      res.json(category);
    } catch (error) {
      console.error(`Error updating category with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Kategori güncellenirken bir hata oluştu' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz kategori ID' });
      }

      const success = await CategoryModel.delete(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Kategori bulunamadı' });
      }

      res.status(200).json({ message: 'Kategori başarıyla silindi' });
    } catch (error) {
      console.error(`Error deleting category with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Kategori silinirken bir hata oluştu' });
    }
  }
}

export default new CategoryController(); 