import { Request, Response } from 'express';
import { User } from '../models/user.model';
import TableModel, { CreateTableDTO, UpdateTableDTO, TableStatus } from '../models/table.model';
import OrderModel from '../models/order.model';
import TablePaymentModel from '../models/table-payment.model';

interface AuthenticatedRequest extends Request {
  user?: User;
}

class TableController {
  constructor() {
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const tables = await TableModel.findAll(activeOnly);
      res.json(tables);
    } catch (error) {
      console.error('Error getting tables:', error);
      res.status(500).json({ error: 'Masaları getirirken bir hata oluştu' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz masa ID' });
      }

      const table = await TableModel.findById(id);
      
      if (!table) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }

      res.json(table);
    } catch (error) {
      console.error(`Error getting table with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Masayı getirirken bir hata oluştu' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const tableData: CreateTableDTO = req.body;

      // Basit doğrulama
      if (!tableData.name || tableData.name.trim() === '') {
        return res.status(400).json({ error: 'Masa adı gerekli' });
      }

      if (!tableData.capacity || tableData.capacity <= 0) {
        return res.status(400).json({ error: 'Geçerli bir masa kapasitesi gerekli' });
      }

      const table = await TableModel.create(tableData);
      res.status(201).json(table);
    } catch (error) {
      console.error('Error creating table:', error);
      res.status(500).json({ error: 'Masa oluşturulurken bir hata oluştu' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz masa ID' });
      }

      const tableData: UpdateTableDTO = req.body;
      
      // Güncelleme için veri kontrolü
      if (Object.keys(tableData).length === 0) {
        return res.status(400).json({ error: 'Güncellenecek veri girilmedi' });
      }

      // Kapasite kontrolü
      if (tableData.capacity !== undefined && tableData.capacity <= 0) {
        return res.status(400).json({ error: 'Geçerli bir masa kapasitesi gerekli' });
      }

      // Status alanı varsa, bunu da tabloda güncelle
      // Frontend'ten gelen status bilgisi, masa durumunu günceller
      if (tableData.status !== undefined) {
        console.log(`[DEBUG] Table ${id} status update: ${tableData.status}`);
        // Status bilgisi modele eklenir - bu alan UpdateTableDTO'ya eklenmeli
      }

      const table = await TableModel.update(id, tableData);
      
      if (!table) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }

      res.json(table);
    } catch (error) {
      console.error(`Error updating table with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Masa güncellenirken bir hata oluştu' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz masa ID' });
      }

      const success = await TableModel.delete(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }

      res.status(200).json({ message: 'Masa başarıyla silindi' });
    } catch (error) {
      console.error(`Error deleting table with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Masa silinirken bir hata oluştu' });
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz masa ID' });
      }

      const { status } = req.body as { status: TableStatus };
      
      if (!status || !['available', 'occupied', 'reserved', 'maintenance'].includes(status)) {
        return res.status(400).json({ 
          error: 'Geçersiz masa durumu. Mümkün değerler: available, occupied, reserved, maintenance' 
        });
      }

      // Masa durumunu güncelle
      const table = await TableModel.update(id, { status });
      
      if (!table) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }

      // Eğer 'available' durumuna geçiyorsa ve masa boşalıyorsa, ilgili işlemleri yap
      if (status === 'available') {
        try {
          // 1. Masadaki tüm aktif siparişleri "tamamlandı" olarak işaretle
          const activeOrders = await OrderModel.findByTableId(id);
          // Sadece aktif durumda olan siparişleri filtrele
          const ordersToComplete = activeOrders.filter(order => 
            ['created', 'in_progress', 'ready', 'delivered'].includes(order.status)
          );
          
          for (const order of ordersToComplete) {
            await OrderModel.updateStatus(order.id, { status: 'completed' });
            console.log(`Sipariş #${order.id} tamamlandı olarak işaretlendi`);
          }
          
          // 2. Masanın aktif ödeme kaydını kapat (eğer ödeme tamamen yapıldıysa)
          const activePayment = await TablePaymentModel.findActiveByTableId(id);
          if (activePayment) {
            if (activePayment.remaining_amount <= 0) {
              await TablePaymentModel.closeTablePayment(activePayment.id, req.user?.id || 1);
              console.log(`Masa ödeme kaydı #${activePayment.id} kapatıldı`);
            } else {
              console.log(`Uyarı: Masa #${id} için ödenmemiş tutar var (${activePayment.remaining_amount}), ödeme kaydı açık kalıyor`);
            }
          }
        } catch (relatedError) {
          console.error(`Masa #${id} boşaltılırken ilişkili kayıtlar güncellenirken hata:`, relatedError);
          // İlgili kayıtları güncellerken hata olsa bile, masa durumu güncellemesi başarılı oldu
          // Bu nedenle 500 dönmüyoruz, ama hata loglanıyor
        }
      }
      
      // Eğer 'occupied' durumuna geçiyorsa, yeni bir aktif ödeme kaydı oluştur
      if (status === 'occupied') {
        try {
          const existingPayment = await TablePaymentModel.findActiveByTableId(id);
          if (!existingPayment) {
            await TablePaymentModel.createForTable(id, req.user?.id || 1);
            console.log(`Masa #${id} için yeni ödeme kaydı oluşturuldu`);
          }
        } catch (paymentError) {
          console.error(`Masa #${id} için ödeme kaydı oluşturulurken hata:`, paymentError);
          // Ödeme kaydı oluşturulamazsa bile masa durumu güncellemesi başarılı oldu
        }
      }
      
      res.json(table);
    } catch (error) {
      console.error(`Error updating table status for ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Masa durumu güncellenirken bir hata oluştu' });
    }
  }
}

export default new TableController(); 