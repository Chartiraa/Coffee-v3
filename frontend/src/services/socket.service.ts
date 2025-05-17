import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    console.log('Socket.IO bağlantısı başlatılıyor:', socketUrl);

    this.socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO bağlantısı kuruldu, socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO bağlantısı koptu, sebep:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO bağlantı hatası:', error.message);
    });
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect() {
    if (this.socket) {
      console.log('Socket.IO bağlantısı başlatılıyor...');
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      console.log('Socket.IO bağlantısı kapatılıyor...');
      this.socket.disconnect();
    }
  }

  public joinOrdersRoom() {
    if (this.socket) {
      console.log('Siparişler odasına katılınıyor...');
      this.socket.emit('join-orders-room');
    }
  }

  public joinTablesRoom() {
    if (this.socket) {
      console.log('Masalar odasına katılınıyor...');
      this.socket.emit('join-tables-room');
    }
  }

  public onNewOrder(callback: (order: any) => void) {
    if (this.socket) {
      console.log('Yeni sipariş event dinleyicisi ekleniyor...');
      this.socket.on('new-order', (order) => {
        console.log('Yeni sipariş alındı:', order);
        callback(order);
      });
    }
  }

  public onOrderUpdated(callback: (order: any) => void) {
    if (this.socket) {
      console.log('Sipariş güncelleme event dinleyicisi ekleniyor...');
      this.socket.on('order-updated', (order) => {
        console.log('Sipariş güncellendi:', order);
        callback(order);
      });
    }
  }

  public onOrderDeleted(callback: (orderId: number) => void) {
    if (this.socket) {
      console.log('Sipariş silme event dinleyicisi ekleniyor...');
      this.socket.on('order-deleted', (orderId) => {
        console.log('Sipariş silindi:', orderId);
        callback(orderId);
      });
    }
  }

  public onTableUpdated(callback: (table: any) => void) {
    if (this.socket) {
      console.log('Masa güncelleme event dinleyicisi ekleniyor...');
      this.socket.on('table-updated', (table) => {
        console.log('Masa güncellendi:', table);
        callback(table);
      });
    }
  }

  public removeAllListeners() {
    if (this.socket) {
      console.log('Tüm event dinleyicileri kaldırılıyor...');
      this.socket.removeAllListeners();
    }
  }
}

export default SocketService.getInstance(); 