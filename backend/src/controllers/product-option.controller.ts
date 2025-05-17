import { Request, Response } from 'express';
import { User } from '../models/user.model';
import ProductOptionModel, { 
  CreateProductOptionDTO, 
  UpdateProductOptionDTO,
  CreateOptionValueDTO,
  UpdateOptionValueDTO
} from '../models/product-option.model';

interface AuthenticatedRequest extends Request {
  user?: User;
}

class ProductOptionController {
  constructor() {
    this.getAllOptions = this.getAllOptions.bind(this);
    this.getOptionById = this.getOptionById.bind(this);
    this.createOption = this.createOption.bind(this);
    this.updateOption = this.updateOption.bind(this);
    this.deleteOption = this.deleteOption.bind(this);
    this.getOptionValues = this.getOptionValues.bind(this);
    this.getOptionValueById = this.getOptionValueById.bind(this);
    this.createOptionValue = this.createOptionValue.bind(this);
    this.updateOptionValue = this.updateOptionValue.bind(this);
    this.deleteOptionValue = this.deleteOptionValue.bind(this);
  }

  // Ürün seçenek kategorileri (Options) için metotlar
  async getAllOptions(req: AuthenticatedRequest, res: Response) {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const options = await ProductOptionModel.findAllOptions(activeOnly);
      res.json(options);
    } catch (error) {
      console.error('Error getting options:', error);
      res.status(500).json({ error: 'Seçenekleri getirirken bir hata oluştu' });
    }
  }

  async getOptionById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz seçenek ID' });
      }

      const option = await ProductOptionModel.findOptionById(id);
      
      if (!option) {
        return res.status(404).json({ error: 'Seçenek bulunamadı' });
      }

      // Seçenek değerlerini de getir
      const values = await ProductOptionModel.findOptionValuesByOptionId(id);
      
      res.json({
        ...option,
        values
      });
    } catch (error) {
      console.error(`Error getting option with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Seçeneği getirirken bir hata oluştu' });
    }
  }

  async createOption(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const optionData: CreateProductOptionDTO = req.body;

      // Basit doğrulama
      if (!optionData.name || optionData.name.trim() === '') {
        return res.status(400).json({ error: 'Seçenek adı gerekli' });
      }

      const option = await ProductOptionModel.createOption(optionData);
      res.status(201).json(option);
    } catch (error) {
      console.error('Error creating option:', error);
      res.status(500).json({ error: 'Seçenek oluşturulurken bir hata oluştu' });
    }
  }

  async updateOption(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz seçenek ID' });
      }

      const optionData: UpdateProductOptionDTO = req.body;
      
      // Güncelleme için veri kontrolü
      if (Object.keys(optionData).length === 0) {
        return res.status(400).json({ error: 'Güncellenecek veri girilmedi' });
      }

      const option = await ProductOptionModel.updateOption(id, optionData);
      
      if (!option) {
        return res.status(404).json({ error: 'Seçenek bulunamadı' });
      }

      res.json(option);
    } catch (error) {
      console.error(`Error updating option with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Seçenek güncellenirken bir hata oluştu' });
    }
  }

  async deleteOption(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz seçenek ID' });
      }

      const success = await ProductOptionModel.deleteOption(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Seçenek bulunamadı' });
      }

      res.status(200).json({ message: 'Seçenek başarıyla silindi' });
    } catch (error) {
      console.error(`Error deleting option with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Seçenek silinirken bir hata oluştu' });
    }
  }

  // Seçenek değerleri (Option Values) için metotlar
  async getOptionValues(req: AuthenticatedRequest, res: Response) {
    try {
      const optionId = parseInt(req.params.optionId);
      if (isNaN(optionId)) {
        return res.status(400).json({ error: 'Geçersiz seçenek ID' });
      }

      const values = await ProductOptionModel.findOptionValuesByOptionId(optionId);
      res.json(values);
    } catch (error) {
      console.error(`Error getting values for option ${req.params.optionId}:`, error);
      res.status(500).json({ error: 'Seçenek değerlerini getirirken bir hata oluştu' });
    }
  }

  async getOptionValueById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz değer ID' });
      }

      const value = await ProductOptionModel.findOptionValueById(id);
      
      if (!value) {
        return res.status(404).json({ error: 'Değer bulunamadı' });
      }

      res.json(value);
    } catch (error) {
      console.error(`Error getting value with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Değeri getirirken bir hata oluştu' });
    }
  }

  async createOptionValue(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const optionId = parseInt(req.params.optionId);
      if (isNaN(optionId)) {
        return res.status(400).json({ error: 'Geçersiz seçenek ID' });
      }

      const valueData: CreateOptionValueDTO = {
        ...req.body,
        option_id: optionId
      };

      // Basit doğrulama
      if (!valueData.value || valueData.value.trim() === '') {
        return res.status(400).json({ error: 'Değer metni gerekli' });
      }

      // Otomatik varsayılan değer ayarlama
      if (valueData.is_default) {
        // Bu seçeneğe ait diğer değerlerin varsayılan durumunu false yap
        const values = await ProductOptionModel.findOptionValuesByOptionId(optionId);
        for (const existingValue of values) {
          if (existingValue.is_default) {
            await ProductOptionModel.updateOptionValue(existingValue.id, { is_default: false });
          }
        }
      }

      const value = await ProductOptionModel.createOptionValue(valueData);
      res.status(201).json(value);
    } catch (error) {
      console.error(`Error creating value for option ${req.params.optionId}:`, error);
      res.status(500).json({ error: 'Değer oluşturulurken bir hata oluştu' });
    }
  }

  async updateOptionValue(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz değer ID' });
      }

      const valueData: UpdateOptionValueDTO = req.body;
      
      // Güncelleme için veri kontrolü
      if (Object.keys(valueData).length === 0) {
        return res.status(400).json({ error: 'Güncellenecek veri girilmedi' });
      }

      // Eğer varsayılan değer olarak işaretleniyorsa
      if (valueData.is_default) {
        const value = await ProductOptionModel.findOptionValueById(id);
        if (value) {
          // Bu seçeneğe ait diğer değerlerin varsayılan durumunu false yap
          const values = await ProductOptionModel.findOptionValuesByOptionId(value.option_id);
          for (const existingValue of values) {
            if (existingValue.id !== id && existingValue.is_default) {
              await ProductOptionModel.updateOptionValue(existingValue.id, { is_default: false });
            }
          }
        }
      }

      const value = await ProductOptionModel.updateOptionValue(id, valueData);
      
      if (!value) {
        return res.status(404).json({ error: 'Değer bulunamadı' });
      }

      res.json(value);
    } catch (error) {
      console.error(`Error updating value with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Değer güncellenirken bir hata oluştu' });
    }
  }

  async deleteOptionValue(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz değer ID' });
      }

      const success = await ProductOptionModel.deleteOptionValue(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Değer bulunamadı' });
      }

      res.status(200).json({ message: 'Değer başarıyla silindi' });
    } catch (error) {
      console.error(`Error deleting value with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Değer silinirken bir hata oluştu' });
    }
  }
}

export default new ProductOptionController(); 