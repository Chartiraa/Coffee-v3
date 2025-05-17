import { Request, Response } from 'express';
import { User } from '../models/user.model';
import InventoryModel, {
  CreateInventoryItemDTO,
  UpdateInventoryItemDTO,
  CreateInventoryTransactionDTO
} from '../models/inventory.model';

interface AuthenticatedRequest extends Request {
  user?: User;
}

class InventoryController {
  constructor() {
    this.getAllItems = this.getAllItems.bind(this);
    this.getItemById = this.getItemById.bind(this);
    this.createItem = this.createItem.bind(this);
    this.updateItem = this.updateItem.bind(this);
    this.adjustQuantity = this.adjustQuantity.bind(this);
    this.getTransactions = this.getTransactions.bind(this);
    this.getItemCategories = this.getItemCategories.bind(this);
    this.getLowStockItems = this.getLowStockItems.bind(this);
  }

  async getAllItems(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const category = req.query.category as string;
      const lowStock = req.query.lowStock === 'true';

      const items = await InventoryModel.findAllItems(category, lowStock);
      res.json(items);
    } catch (error) {
      console.error('Error getting inventory items:', error);
      res.status(500).json({ error: 'Stok öğeleri getirilirken bir hata oluştu' });
    }
  }

  async getItemById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz stok öğesi ID' });
      }

      const item = await InventoryModel.findItemById(id);
      
      if (!item) {
        return res.status(404).json({ error: 'Stok öğesi bulunamadı' });
      }

      res.json(item);
    } catch (error) {
      console.error(`Error getting inventory item with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Stok öğesi getirilirken bir hata oluştu' });
    }
  }

  async createItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const itemData: CreateInventoryItemDTO = req.body;

      // Veri doğrulama
      if (!itemData.name || itemData.name.trim() === '') {
        return res.status(400).json({ error: 'Stok öğesi adı gerekli' });
      }

      if (!itemData.category || itemData.category.trim() === '') {
        return res.status(400).json({ error: 'Kategori gerekli' });
      }

      if (!itemData.unit || itemData.unit.trim() === '') {
        return res.status(400).json({ error: 'Birim gerekli' });
      }

      if (itemData.quantity < 0) {
        return res.status(400).json({ error: 'Miktar negatif olamaz' });
      }

      if (itemData.min_quantity < 0) {
        return res.status(400).json({ error: 'Minimum miktar negatif olamaz' });
      }

      if (itemData.cost_price < 0) {
        return res.status(400).json({ error: 'Maliyet fiyatı negatif olamaz' });
      }

      const item = await InventoryModel.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      res.status(500).json({ error: 'Stok öğesi oluşturulurken bir hata oluştu' });
    }
  }

  async updateItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz stok öğesi ID' });
      }

      const itemData: UpdateInventoryItemDTO = req.body;
      
      // Veri doğrulama
      if (Object.keys(itemData).length === 0) {
        return res.status(400).json({ error: 'Güncellenecek veri girilmedi' });
      }

      if (itemData.quantity !== undefined && itemData.quantity < 0) {
        return res.status(400).json({ error: 'Miktar negatif olamaz' });
      }

      if (itemData.min_quantity !== undefined && itemData.min_quantity < 0) {
        return res.status(400).json({ error: 'Minimum miktar negatif olamaz' });
      }

      if (itemData.cost_price !== undefined && itemData.cost_price < 0) {
        return res.status(400).json({ error: 'Maliyet fiyatı negatif olamaz' });
      }

      const item = await InventoryModel.updateItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ error: 'Stok öğesi bulunamadı' });
      }

      res.json(item);
    } catch (error) {
      console.error(`Error updating inventory item with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Stok öğesi güncellenirken bir hata oluştu' });
    }
  }

  async adjustQuantity(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'barista'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz stok öğesi ID' });
      }

      const { quantity, transaction_type, unit_cost, notes } = req.body;
      
      if (quantity === undefined) {
        return res.status(400).json({ error: 'Miktar gerekli' });
      }

      // İşlem türü kontrolü
      const validTypes = ['purchase', 'usage', 'adjustment', 'loss'];
      if (!validTypes.includes(transaction_type)) {
        return res.status(400).json({ error: 'Geçersiz işlem türü' });
      }

      // Satın alma işlemiyse birim maliyet gerekli
      if (transaction_type === 'purchase' && unit_cost === undefined) {
        return res.status(400).json({ error: 'Satın alma işlemi için birim maliyet gerekli' });
      }

      const item = await InventoryModel.adjustQuantity(
        id,
        quantity,
        req.user.id,
        notes,
        transaction_type,
        unit_cost
      );
      
      if (!item) {
        return res.status(404).json({ error: 'Stok öğesi bulunamadı' });
      }

      res.json(item);
    } catch (error) {
      console.error(`Error adjusting inventory quantity for ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Stok miktarı ayarlanırken bir hata oluştu' });
    }
  }

  async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const itemId = parseInt(req.query.itemId as string);
      const transactionType = req.query.transactionType as string;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }

      const transactions = await InventoryModel.getTransactions(
        isNaN(itemId) ? undefined : itemId,
        transactionType,
        startDate,
        endDate
      );
      
      res.json(transactions);
    } catch (error) {
      console.error('Error getting inventory transactions:', error);
      res.status(500).json({ error: 'Stok işlemleri getirilirken bir hata oluştu' });
    }
  }

  async getItemCategories(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const categories = await InventoryModel.getItemCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error getting inventory categories:', error);
      res.status(500).json({ error: 'Stok kategorileri getirilirken bir hata oluştu' });
    }
  }

  async getLowStockItems(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const items = await InventoryModel.getLowStockItems();
      res.json(items);
    } catch (error) {
      console.error('Error getting low stock items:', error);
      res.status(500).json({ error: 'Düşük stok öğeleri getirilirken bir hata oluştu' });
    }
  }
}

export default new InventoryController(); 