import { Request, Response } from 'express';
import { User } from '../models/user.model';
import OrderModel, { CreateOrderDTO, UpdateOrderStatusDTO } from '../models/order.model';
import TableModel from '../models/table.model';
import { socketService } from '../index';

interface AuthenticatedRequest extends Request {
  user?: User;
}

class OrderController {
  constructor() {
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getByTableId = this.getByTableId.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.cancelOrder = this.cancelOrder.bind(this);
    this.update = this.update.bind(this);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'waiter'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const orderData: CreateOrderDTO = req.body;

      // Veri doğrulama
      if (!orderData.table_id) {
        return res.status(400).json({ error: 'Masa ID gerekli' });
      }

      if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ error: 'Sipariş en az bir ürün içermelidir' });
      }

      // Masa kontrolü
      const table = await TableModel.findById(orderData.table_id);
      if (!table) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }
      
      if (!table.is_active) {
        return res.status(400).json({ error: 'Bu masa aktif değil' });
      }

      const order = await OrderModel.create(orderData, req.user.id);
      
      if (!order) {
        return res.status(500).json({ error: 'Sipariş oluşturulurken bir hata oluştu' });
      }
      
      // Masanın durumunu 'occupied' (dolu) olarak güncelle
      if (table.status === 'available') {
        const updatedTable = await TableModel.update(orderData.table_id, { status: 'occupied' });
        // Masa güncellemesini bildir
        socketService.emitTableUpdate(updatedTable);
      }

      // Yeni siparişi bildir
      socketService.emitNewOrder(order);

      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Sipariş oluşturulurken bir hata oluştu' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz sipariş ID' });
      }

      const order = await OrderModel.findById(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      res.json(order);
    } catch (error) {
      console.error(`Error getting order with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Sipariş getirilirken bir hata oluştu' });
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      // Admin ve manager tüm siparişleri görebilir
      if (!['admin', 'manager', 'barista', 'cashier'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const status = req.query.status as string;
      const validStatuses = ['created', 'in_progress', 'ready', 'delivered', 'completed', 'cancelled'];
      
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Geçersiz sipariş durumu' });
      }

      const orders = await OrderModel.findAll(status as any);
      res.json(orders);
    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({ error: 'Siparişler getirilirken bir hata oluştu' });
    }
  }

  async getByTableId(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const tableId = parseInt(req.params.tableId);
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Geçersiz masa ID' });
      }

      const status = req.query.status as string;
      const excludeCompleted = req.query.excludeCompleted === 'true';
      const validStatuses = ['created', 'in_progress', 'ready', 'delivered', 'completed', 'cancelled'];
      
      if (status && !validStatuses.includes(status)) {
        console.log('Geçersiz sipariş durumu:', status);
        return res.status(400).json({ error: status });
      }

      // Eğer tamamlanmış siparişleri hariç tutma isteği varsa, siparişleri filtreleyin
      let orders = await OrderModel.findByTableId(tableId, status as any);
      
      if (excludeCompleted) {
        orders = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
      }
      
      res.json(orders);
    } catch (error) {
      console.error(`Error getting orders for table ${req.params.tableId}:`, error);
      res.status(500).json({ error: 'Masa siparişleri getirilirken bir hata oluştu' });
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz sipariş ID' });
      }

      const updateData: UpdateOrderStatusDTO = req.body;
      const validStatuses = ['created', 'in_progress', 'ready', 'delivered', 'completed', 'cancelled'];
      
      if (!updateData.status || !validStatuses.includes(updateData.status)) {
        return res.status(400).json({ error: 'Geçersiz sipariş durumu' });
      }

      // Rol kontrolü - hangi durum güncellemesini kim yapabilir
      if (updateData.status === 'in_progress' && !['admin', 'manager', 'barista'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Barista, manager veya admin rolüne sahip olmalısınız' });
      }
      
      if (updateData.status === 'ready' && !['admin', 'manager', 'barista'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Barista, manager veya admin rolüne sahip olmalısınız' });
      }
      
      if (updateData.status === 'delivered' && !['admin', 'manager', 'waiter'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Garson, manager veya admin rolüne sahip olmalısınız' });
      }
      
      if (updateData.status === 'completed' && !['admin', 'manager', 'cashier'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Kasiyer, manager veya admin rolüne sahip olmalısınız' });
      }

      const updatedOrder = await OrderModel.updateStatus(id, updateData);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      // Sipariş güncellemesini bildir
      socketService.emitOrderUpdate(updatedOrder);

      // Sipariş tamamlandıysa veya iptal edildiyse masa durumunu kontrol et
      if (updateData.status === 'completed' || updateData.status === 'cancelled') {
        const activeOrders = await OrderModel.findByTableId(updatedOrder.table_id, 'created');
        if (activeOrders.length === 0) {
          const updatedTable = await TableModel.update(updatedOrder.table_id, { status: 'available' });
          // Masa güncellemesini bildir
          socketService.emitTableUpdate(updatedTable);
        }
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error(`Error updating order status for ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Sipariş durumu güncellenirken bir hata oluştu' });
    }
  }

  async cancelOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz sipariş ID' });
      }

      const cancelledOrder = await OrderModel.cancel(id);
      
      if (!cancelledOrder) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      res.json(cancelledOrder);
    } catch (error) {
      console.error(`Error cancelling order with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Sipariş iptal edilirken bir hata oluştu' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      if (!['admin', 'manager', 'waiter'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Geçersiz sipariş ID' });
      }

      const orderData = req.body;

      // Veri doğrulama
      if (!orderData.table_id) {
        return res.status(400).json({ error: 'Masa ID gerekli' });
      }

      if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ error: 'Sipariş en az bir ürün içermelidir' });
      }

      // Masa kontrolü
      const table = await TableModel.findById(orderData.table_id);
      if (!table) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }
      
      if (!table.is_active) {
        return res.status(400).json({ error: 'Bu masa aktif değil' });
      }

      // Mevcut siparişi kontrol et
      const existingOrder = await OrderModel.findById(id);
      if (!existingOrder) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      // Sadece belirli durumlardaki siparişler güncellenebilir
      if (!['created', 'in_progress'].includes(existingOrder.status)) {
        return res.status(400).json({ error: 'Bu sipariş artık güncellenemez' });
      }

      const updatedOrder = await OrderModel.update(id, orderData, req.user.id);
      
      if (!updatedOrder) {
        return res.status(500).json({ error: 'Sipariş güncellenirken bir hata oluştu' });
      }
      
      // Masanın durumunu 'occupied' (dolu) olarak güncelle
      if (table.status === 'available') {
        await TableModel.update(orderData.table_id, { status: 'occupied' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error(`Error updating order with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Sipariş güncellenirken bir hata oluştu' });
    }
  }
}

export default new OrderController(); 