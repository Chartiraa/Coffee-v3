import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

class SocketService {
  private io: Server;

  constructor(server: HttpServer) {
    console.log('Socket.IO servisi başlatılıyor...');
    
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: ['GET', 'POST']
      }
    });

    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Yeni bir client bağlandı:', socket.id);

      // Siparişler odasına katılma
      socket.on('join-orders-room', () => {
        socket.join('orders');
        console.log(`${socket.id} siparişler odasına katıldı`);
      });

      // Masalar odasına katılma
      socket.on('join-tables-room', () => {
        socket.join('tables');
        console.log(`${socket.id} masalar odasına katıldı`);
      });

      // Garson çağırma odasına katılma
      socket.on('join-waiter-calls-room', () => {
        socket.join('waiter-calls');
        console.log(`${socket.id} garson çağırma odasına katıldı`);
      });

      socket.on('disconnect', (reason) => {
        console.log('Client bağlantısı koptu:', socket.id, 'Sebep:', reason);
      });
    });
  }

  // Yeni sipariş bildirimi gönder
  public emitNewOrder(order: any) {
    console.log('Yeni sipariş bildirimi gönderiliyor:', order);
    this.io.to('orders').emit('new-order', order);
  }

  // Sipariş güncelleme bildirimi gönder
  public emitOrderUpdate(order: any) {
    console.log('Sipariş güncelleme bildirimi gönderiliyor:', order);
    this.io.to('orders').emit('order-updated', order);
  }

  // Sipariş silme bildirimi gönder
  public emitOrderDelete(orderId: number) {
    console.log('Sipariş silme bildirimi gönderiliyor:', orderId);
    this.io.to('orders').emit('order-deleted', orderId);
  }

  // Masa durumu güncelleme bildirimi gönder
  public emitTableUpdate(table: any) {
    console.log('Masa güncelleme bildirimi gönderiliyor:', table);
    this.io.to('tables').emit('table-updated', table);
  }

  // Yeni garson çağırma bildirimi gönder
  public emitNewWaiterCall(waiterCall: any) {
    console.log('Yeni garson çağırma bildirimi gönderiliyor:', waiterCall);
    this.io.to('waiter-calls').emit('waiterRequest', waiterCall);
  }

  // Garson çağırma güncelleme bildirimi gönder
  public emitWaiterCallUpdate(waiterCall: any) {
    console.log('Garson çağırma güncelleme bildirimi gönderiliyor:', waiterCall);
    this.io.to('waiter-calls').emit('waiterRequest', waiterCall);
  }
}

export default SocketService; 