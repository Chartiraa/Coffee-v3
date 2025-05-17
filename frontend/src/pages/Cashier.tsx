import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Stack,
  Tab,
  Tabs
} from '@mui/material';
import {
  TableRestaurant as TableIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Check as CheckIcon,
  ArrowBackIos as ArrowBackIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Done as DoneIcon,
  Money as MoneyIcon,
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { tableService, orderService, paymentService } from '../services/api';

// Arayüz tanımlamaları
interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
  active: boolean;
  location?: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  paid_quantity?: number; // Ödenen miktar
  temporary_paid_quantity?: number; // Geçici olarak ödenecek miktar
}

interface Order {
  id: number;
  table_id: number;
  table_number?: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer_count?: number;
  staff_id?: number;
  staff_name?: string;
  notes?: string;
  calculated_total?: number; // Hesaplayarak eklediğimiz toplam tutar
}

interface Payment {
  id: number;
  order_id: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  staff_id?: number;
  staff_name?: string;
  notes?: string;
}

const Cashier: React.FC = () => {
  // State tanımlamaları
  const [view, setView] = useState<'tables' | 'order-details'>('tables');
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit_card'>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [payQuantity, setPayQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [totalTableDiscount, setTotalTableDiscount] = useState<number>(0);
  
  // Masa ödeme bilgileri
  const [activeTablePayment, setActiveTablePayment] = useState<any>(null);
  const [tableItemsPaymentStatus, setTableItemsPaymentStatus] = useState<any[]>([]);
  
  // Dialog kontrolleri
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  
  // Yükleme durumları
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  
  // Hata mesajları
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [openAlert, setOpenAlert] = useState<boolean>(false);

  // Verileri yükle
  useEffect(() => {
    fetchTables();
  }, []);

  // Toplam tutarı yalnızca bir kez hesapla
  useEffect(() => {
    if (tableOrders.length > 0) {
      // Siparişlere gerçek toplam tutarı hesapla ve ekle
      const updatedOrders = tableOrders.map(order => {
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          let calculatedTotal = 0;
          
          for (const item of order.items) {
            const itemPrice = Number(item.total_price) || (Number(item.unit_price) * Number(item.quantity));
            calculatedTotal = Number(calculatedTotal) + Number(itemPrice);
          }
          
          // Hesaplanan toplam 0 değilse veya mevcut total_amount 0 ise güncelle
          if (calculatedTotal > 0 && (!order.total_amount || order.total_amount <= 0)) {
            return {
              ...order,
              calculated_total: Number(calculatedTotal)
            };
          }
        }
        return order;
      });
      
      if (JSON.stringify(updatedOrders) !== JSON.stringify(tableOrders)) {
        setTableOrders(updatedOrders);
      }
    }
  }, [tableOrders]);

  // Masaları yükle
  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const response = await tableService.getTables(true);
      const formattedTables = response.data.map((table: any) => ({
        id: table.id,
        number: parseInt(table.name.replace('Masa ', '')) || table.id,
        capacity: table.capacity,
        status: table.status || 'available',
        active: table.is_active,
        location: table.location || 'İç Alan'
      }));
      
      // Dolu masaları filtrele
      const occupied = formattedTables.filter((table: Table) => table.status === 'occupied');
      
      setTables(formattedTables);
    } catch (error) {
      console.error('Masa verileri yüklenirken hata oluştu:', error);
      showAlert('Masa verileri yüklenirken bir hata oluştu!', 'error');
    } finally {
      setLoadingTables(false);
    }
  };

  // Masa seçimini işle ve o masanın siparişlerini yükle
  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table);
    setView('order-details');
    
    if (table.id) {
      await fetchTableOrders(table.id);
    }
  };

  // Masaya geri dön
  const handleBackToTables = () => {
    setView('tables');
    setSelectedTable(null);
    setSelectedOrder(null);
    setTableOrders([]);
    setDiscount(0);
    setDiscountAmount(0);
    setTotalTableDiscount(0);
  };

  // Masanın tüm siparişlerini yükle
  const fetchTableOrders = async (tableId: number) => {
    setLoadingOrder(true);
    try {
      const response = await orderService.getTableOrders(tableId);
      console.log('Masa siparişleri:', response.data);
      
      // Tamamlanmamış siparişleri filtrele
      const activeOrders = response.data.filter((order: Order) => 
        order.status !== 'completed' && order.status !== 'cancelled'
      );
      
      if (activeOrders.length > 0) {
        // Siparişleri tarihe göre sırala (en yeniden en eskiye)
        const sortedOrders = activeOrders.sort((a: Order, b: Order) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Önce her sipariş için detay bilgilerini al
        const detailedOrders = [];
        for (const order of sortedOrders) {
          try {
            const orderDetail = await orderService.getOrderById(order.id);
            if (orderDetail.data) {
              // Sipariş detaylarını al ve items array'i yoksa boş dizi ekle
              const orderWithItems = {
                ...orderDetail.data,
                items: orderDetail.data.items || []
              };
              
              // Her öğe için ödeme bilgilerini ekle
              orderWithItems.items = orderWithItems.items.map((item: OrderItem) => ({
                ...item,
                paid_quantity: item.paid_quantity || 0,
                temporary_paid_quantity: 0
              }));
              
              detailedOrders.push(orderWithItems);
            }
          } catch (error) {
            console.error(`Sipariş #${order.id} detayları alınırken hata:`, error);
            // Hata durumunda orijinal siparişi kullan
            detailedOrders.push({
              ...order,
              items: order.items || [] // items yoksa boş dizi ekle
            });
          }
        }
        
        console.log('İşlenmiş siparişler:', detailedOrders);
        setTableOrders(detailedOrders);
        
        // Ödeme bilgileri için API istekleri
        try {
          // Aktif masa ödeme bilgilerini getir
          const activePaymentResponse = await paymentService.getActiveTablePayment(tableId);
          setActiveTablePayment(activePaymentResponse.data);
          console.log('Aktif masa ödeme bilgileri:', activePaymentResponse.data);
          
          // Toplam indirim tutarını da set et
          if (activePaymentResponse.data && activePaymentResponse.data.discount_amount !== undefined) {
            setTotalTableDiscount(Number(activePaymentResponse.data.discount_amount));
          }
          
          // ÖNEMLİ: Eğer backendden gelen remaining_amount sıfırsa, masayı kapat
          if (activePaymentResponse.data && 
              activePaymentResponse.data.remaining_amount !== undefined && 
              Number(activePaymentResponse.data.remaining_amount) <= 0.01) {
            console.log('fetchTableOrders: Backend kalan tutar sıfır, masa kapanacak', activePaymentResponse.data.remaining_amount);
            await closeTable(tableId);
            return; // İşlemi burada sonlandır
          }
          
          // Masa ürünlerinin ödeme durumunu getir
          const itemStatusResponse = await paymentService.getTableItemsPaymentStatus(tableId);
          setTableItemsPaymentStatus(itemStatusResponse.data);
          
          // Ödeme durumlarını sipariş öğelerine uygula
          if (itemStatusResponse.data && itemStatusResponse.data.length > 0) {
            const updatedOrders = detailedOrders.map((order: Order) => {
              if (order.items && Array.isArray(order.items)) {
                order.items = order.items.map((item: OrderItem) => {
                  // Item ID'ye göre ödeme durumunu bul
                  const paymentStatus = itemStatusResponse.data.find(
                    (status: any) => status.order_item_id === item.id
                  );
                  
                  // Eğer ödeme durumu bulunduysa, ödenen miktarı güncelle
                  if (paymentStatus) {
                    return {
                      ...item,
                      paid_quantity: paymentStatus.paid_quantity || 0
                    };
                  }
                  return item;
                });
              }
              return order;
            });
            
            setTableOrders(updatedOrders);
          }
        } catch (paymentError) {
          console.error('Ödeme bilgileri yüklenirken hata:', paymentError);
        }
      } else {
        setTableOrders([]);
      }
    } catch (error) {
      console.error('Masa siparişleri yüklenirken hata oluştu:', error);
      showAlert('Masa siparişleri yüklenirken bir hata oluştu!', 'error');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Sipariş değiştirme
  const handleOrderChange = (orderId: number) => {
    const selectedOrder = tableOrders.find(order => order.id === orderId);
    if (selectedOrder) {
      setSelectedOrder(selectedOrder);
      // Diskontu sıfırla
      setDiscount(0);
      setDiscountAmount(0);
    }
  };

  // Toplam tutarı hesaplama
  const calculateTotalAmount = (): number => {
    // Eğer aktif masa ödemesi varsa ve total_amount değeri tanımlıysa, direkt backend değerini kullan
    if (activeTablePayment && activeTablePayment.total_amount !== undefined && 
        !isNaN(activeTablePayment.total_amount)) {
      return Number(activeTablePayment.total_amount);
    }
    
    // Backend değeri yoksa frontend hesaplaması yap
    let totalAmount = 0;
    
    if (!tableOrders || tableOrders.length === 0) {
      return 0;
    }
    
    // Her siparişi döngüye al
    for (const order of tableOrders) {
      // Önce calculated_total varsa onu kullan
      if (order.calculated_total && order.calculated_total > 0) {
        totalAmount = Number(totalAmount) + Number(order.calculated_total);
        continue;
      }
      
      // Sipariş objesi içinde items var mı ve dizi mi kontrol et
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        // Her siparişin ürünlerini döngüye al ve toplam tutarı hesapla
        let orderTotal = 0;
        for (const item of order.items) {
          const itemPrice = Number(item.total_price) || (Number(item.unit_price) * Number(item.quantity));
          orderTotal = Number(orderTotal) + Number(itemPrice);
        }
        
        totalAmount = Number(totalAmount) + Number(orderTotal);
      } else if (order.total_amount && order.total_amount > 0) {
        // Eğer ürünler yoksa veya boşsa ama sipariş total_amount'ı varsa onu kullan
        totalAmount = Number(totalAmount) + Number(order.total_amount);
      }
    }
    
    return Number(totalAmount);
  };

  // Ödenmiş tutarı hesaplama
  const calculatePaidAmount = (): number => {
    // Eğer aktif masa ödemesi varsa ve paid_amount değeri tanımlıysa, direkt backend değerini kullan
    if (activeTablePayment && activeTablePayment.paid_amount !== undefined && 
        !isNaN(activeTablePayment.paid_amount)) {
      // paid_amount'tan indirimi çıkarmamaya dikkat et - çünkü backend'den gelen paid_amount indirimsiz değerdir
      return Number(activeTablePayment.paid_amount);
    }
    
    // Backend değeri yoksa frontend hesaplaması yap
    let paidTotal = 0;
    
    // Masa ürünlerinin ödeme bilgisi varsa kullan
    if (tableItemsPaymentStatus && tableItemsPaymentStatus.length > 0) {
      tableItemsPaymentStatus.forEach((itemStatus: any) => {
        if (itemStatus.paid_amount && !isNaN(itemStatus.paid_amount)) {
          paidTotal += Number(itemStatus.paid_amount);
        }
      });
      return Number(paidTotal);
    }
    
    // Ödeme bilgisi yoksa frontend'de mevcut verilere göre hesapla
    tableOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: OrderItem) => {
          const paidAmount = Number(item.unit_price || item.total_price / item.quantity) * Number(item.paid_quantity || 0);
          paidTotal = Number(paidTotal) + Number(paidAmount);
        });
      }
    });
    
    return Number(paidTotal);
  };

  // Geçici ödenmiş tutarı hesaplama
  const calculateTemporaryPaidAmount = (): number => {
    let tempPaidTotal = 0;
    
    tableOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: OrderItem) => {
          const tempPaidAmount = Number(item.unit_price || item.total_price / item.quantity) * Number(item.temporary_paid_quantity || 0);
          tempPaidTotal = Number(tempPaidTotal) + Number(tempPaidAmount);
        });
      }
    });
    
    return Number(tempPaidTotal);
  };

  // Kalan tutarı hesaplama
  const calculateRemainingAmount = (): number => {
    try {
      // BACKEND DEĞERİ VAR MI KONTROL - EN GÜVENİLİR YÖNTEM
      if (activeTablePayment && 
          activeTablePayment.remaining_amount !== undefined) {
        
        // Backend'den gelen değer direkt olarak alınır
        // Bu değer backendden sıfır geliyorsa, kalan tutar sıfırdır
        const rawRemainingAmount = Number(activeTablePayment.remaining_amount);
        
        // Geçici ödeme miktarını çıkar (çünkü backend değeri bunu içermiyor)
        const tempPaid = Number(calculateTemporaryPaidAmount());
        const remaining = Math.max(0, rawRemainingAmount - tempPaid);
        
        //console.log('Backend kalan tutar:', rawRemainingAmount, 'Geçici ödeme:', tempPaid, 'Hesaplanan kalan:', remaining);
        return remaining;
      }
      
      // FRONTEND HESAPLAMASI
      // Toplam, ödenmiş ve geçici ödeme tutarlarını hesapla
      const total = Number(calculateTotalAmount());
      const paid = Number(calculatePaidAmount());
      const tempPaid = Number(calculateTemporaryPaidAmount());
      
      // Hesaplama ve sonuç
      const remaining = Math.max(0, total - paid - tempPaid);
      //console.log('Frontend hesaplama - Toplam:', total, 'Ödenen:', paid, 'Geçici:', tempPaid, 'Kalan:', remaining);
      
      // Alternatif kontrol: Eğer total ve paid değerleri aynı ise, kalan 0 olmalı
      if (Math.abs(total - paid) < 0.01) {
        console.log('Toplam ve ödenen tutarlar eşit, kalan tutar 0 olarak döndürülüyor');
        return 0;
      }
      
      return remaining;
    } catch (error) {
      console.error('Kalan tutar hesaplanırken hata oluştu:', error);
      // Hata durumunda güvenli değer dön
      return 0;
    }
  };

  // Ürün için ödeme işlemi başlat
  const handleItemSelect = (item: OrderItem, orderId: number) => {
    setSelectedItem(item);
    setSelectedOrder(tableOrders.find(order => order.id === orderId) || null);
    
    // Birim fiyatı hesapla
    const unitPrice = item.unit_price || (item.total_price / item.quantity);
    
    // Kalan ödenebilir miktarı kontrol et (geçici ödemeleri hesaba katmadan)
    const remainingQuantity = item.quantity - (item.paid_quantity || 0);
    
    if (remainingQuantity <= 0) {
      showAlert('Bu ürünün tamamı zaten ödenmiş!', 'error');
      return;
    }
    
    // Eğer daha önce bir geçici ödeme yapılmışsa, kalan miktardan geçici ödeme miktarını da çıkar
    const availableQuantity = remainingQuantity - (item.temporary_paid_quantity || 0);
    
    if (availableQuantity <= 0) {
      showAlert('Bu ürün için geçici ödemeniz bulunmaktadır. Önce iptal edin veya ödemeyi tamamlayın.', 'error');
      return;
    }
    
    // Pay quantity'yi kalan miktar ile sınırla
    setPayQuantity(Math.min(1, availableQuantity));
    
    // Ödeme diyaloğunu aç
    setOpenItemDialog(true);
  };

  // Ürün ödeme miktarını seçip ana ödeme ekranına aktar
  const handleItemPayment = () => {
    if (!selectedItem || !selectedOrder) return;
    
    // Seçilen ürün için ödeme tutarını hesapla
    const unitPrice = Number(selectedItem.unit_price) || (Number(selectedItem.total_price) / Number(selectedItem.quantity));
    const amount = Number(unitPrice) * Number(payQuantity);
    
    // Ödeme diyaloğunu kapat
    setOpenItemDialog(false);
    
    // TableOrders'da seçilen ürünün temporary_paid_quantity değerini güncelle
    const updatedOrders = tableOrders.map(order => {
      if (order.id === selectedOrder.id) {
        const updatedItems = order.items.map(item => {
          if (item.id === selectedItem.id) {
            return {
              ...item,
              temporary_paid_quantity: Number(payQuantity)
            };
          }
          return item;
        });
        return {
          ...order,
          items: updatedItems
        };
      }
      return order;
    });
    
    // Sipariş state'ini güncelle
    setTableOrders(updatedOrders);
    
    // Şu anki ödeme tutarını al ve yeni ürün tutarını ekle (kümülatif toplama)
    const currentAmount = Number(paymentAmount) || 0;
    const newAmount = currentAmount + amount;
    
    // Tahsil edilecek tutarı ayarla
    setPaymentAmount(Number(newAmount.toFixed(2)));
    
    // Ödeme notlarını güncelle
    if (paymentNotes) {
      setPaymentNotes(`${paymentNotes}, ${selectedItem.product_name} (${payQuantity} adet)`);
    } else {
      setPaymentNotes(`${selectedItem.product_name} (${payQuantity} adet)`);
    }
    
    // Başarı mesajı göster
    showAlert(`${selectedItem.product_name} (${payQuantity} adet) tahsil edilecek tutara eklendi.`, 'success');
  };

  // Ödeme işlemini gerçekleştir
  const handleProcessPayment = async () => {
    if (!selectedTable) {
      showAlert('Ödeme yapılacak masa seçilmedi!', 'error');
      return;
    }
    
    // Sipariş seçilmediyse, masadaki ilk siparişi otomatik olarak seç
    let activeOrder = selectedOrder;
    if (!activeOrder && tableOrders.length > 0) {
      activeOrder = tableOrders[0];
      setSelectedOrder(activeOrder);
    }
    
    if (!activeOrder) {
      showAlert('Ödeme yapılacak sipariş bulunamadı!', 'error');
      return;
    }
    
    // Ödeme tutarı girilmemişse, kalan tutarı kullan
    let paymentAmountToUse = paymentAmount;
    if (paymentAmountToUse <= 0) {
      const remainingAmount = calculateRemainingAmount();
      if (remainingAmount <= 0) {
        showAlert('Ödenecek tutar kalmadı!', 'error');
        return;
      }
      paymentAmountToUse = remainingAmount;
      setPaymentAmount(remainingAmount);
      setPaymentNotes(paymentNotes || 'Tüm hesabın ödemesi');
    }
    
    setProcessingPayment(true);
    try {
      // İndirim hesaplama - SADECE şu anki ödemeye uygulanacak
      const discountAmountToApply = discount > 0 ? Number((paymentAmountToUse * discount / 100).toFixed(2)) : 0;
      const paymentAmountAfterDiscount = Number((paymentAmountToUse - discountAmountToApply).toFixed(2));
      
      // Ödeme verisini hazırla
      const paymentData: any = {
        table_id: selectedTable.id, // Artık table_id kullanılıyor
        order_id: activeOrder.id, // Order ID'yi dahil et (backend bunu kontrol edecek)
        amount: Number(paymentAmountToUse),
        payment_method: paymentType,
        notes: `${paymentNotes}${discount > 0 ? ` (%${discount} indirim uygulandı)` : ''}`,
      };
      
      // İndirim varsa ekle
      if (discount > 0) {
        paymentData.discount_amount = discountAmountToApply;
        paymentData.discount_reason = `Kasada indirim uygulandı (%${discount})`;
      }
      
      // Ürün bazlı ödeme yapılıyorsa, ilgili ürünleri ekle
      const isItemBasedPayment = tableOrders.some(order => 
        order.items.some(item => item.temporary_paid_quantity && item.temporary_paid_quantity > 0)
      );
      
      if (isItemBasedPayment) {
        paymentData.order_items = [];
        
        tableOrders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              if (item.temporary_paid_quantity && item.temporary_paid_quantity > 0) {
                const unitPrice = Number(item.unit_price) || (Number(item.total_price) / Number(item.quantity));
                
                paymentData.order_items.push({
                  order_item_id: item.id,
                  paid_quantity: item.temporary_paid_quantity,
                  amount: Number((unitPrice * item.temporary_paid_quantity).toFixed(2))
                });
              }
            });
          }
        });
      }
      
      console.log('Gönderilen ödeme verileri:', paymentData);
      const response = await paymentService.createPayment(paymentData);
      console.log('Ödeme yanıtı:', response.data);
      
      // İndirim yapıldıysa, gelen indirim bilgisini toplam indirime ekle
      if (discount > 0 && discountAmountToApply > 0) {
        // Backend'den gelen yeni toplam indirim varsa
        if (response.data && response.data.total_discount_amount !== undefined) {
          // Toplam indirim tutarını güncelle
          const newTotalDiscount = Number(response.data.total_discount_amount);
          //console.log('Güncel toplam indirim (backendden):', newTotalDiscount);
          setTotalTableDiscount(newTotalDiscount);
        } else {
          // Backend toplam indirim dönmediyse, mevcut toplama ekle
          const newTotalDiscount = Number(totalTableDiscount) + Number(discountAmountToApply);
          //console.log('Güncel toplam indirim (frontend hesaplama):', newTotalDiscount);
          setTotalTableDiscount(newTotalDiscount);
        }
      }
      
      // ÖNEMLİ: Diyaloğu hemen kapat ve yükleme göstergesini kaldır
      // Böylece kullanıcı beklemek zorunda kalmaz
      setOpenPaymentDialog(false);
      setProcessingPayment(false);
      
      // Backend'den direkt olarak remaining_amount kontrolü yap
      // Bu değer 0 veya küçükse masa kapatılacak 
      if (response.data && response.data.remaining_amount !== undefined) {
        const remainingAmount = Number(response.data.remaining_amount);
        //console.log('Backend kalan tutar direkt kontrolü:', remainingAmount);
        
        if (remainingAmount <= 0.01) {
          //console.log('Backend kalan tutar sıfır, masa kapanacak');
          await closeTable(selectedTable.id);
          
          // İşlemi burada sonlandır, başka alert gösterme
          return;
        }
      }
      
      // Sadece backend remaining_amount dönmediyse diğer kontrolleri yap
      let masaKapatildi = false;
      
      // Masa yükleme
      await fetchTableOrders(selectedTable.id);
      
      // YENİ ve GÜNCEL calculateRemainingAmount() ile tekrar hesapla
      const updatedRemainingAmount = calculateRemainingAmount();
      console.log('Son kontrolde hesaplanan kalan tutar:', updatedRemainingAmount);
      
      // Kalan tutar sıfır ise masa kapat
      if (updatedRemainingAmount <= 0.01) {
        console.log('Kalan tutar sıfır, masa kapanacak');
        masaKapatildi = await closeTable(selectedTable.id);
      }
      
      // Sadece masa kapatılmadıysa ve seçili masa hala varsa bu mesajı göster
      if (activeTablePayment.remaining_amount !== "0.00") {
        //console.log('activeTablePayment.remaining_amount:', activeTablePayment.remaining_amount);
        //showAlert('Ödeme başarıyla alındı, masa hala açık!', 'success');
      }
      
      // State'leri temizle
      setSelectedItem(null);
      setPayQuantity(1);
      
      // Varsayılan değerlere sıfırla
      setPaymentAmount(0);
      setPaymentType('cash');
      setPaymentNotes('');
      setDiscount(0);
      setDiscountAmount(0);
    } catch (error) {
      console.error('Ödeme işlemi sırasında hata oluştu:', error);
      
      // Diyaloğu kapat ve yükleme göstergesini kaldır
      setOpenPaymentDialog(false);
      setProcessingPayment(false);
      
      showAlert('Ödeme işlemi sırasında bir hata oluştu!', 'error');
      
      // Hata durumunda temporary_paid_quantity'leri sıfırla
      const resetTempPayments = tableOrders.map(order => {
        const updatedItems = order.items.map(item => ({
          ...item,
          temporary_paid_quantity: 0
        }));
        return {
          ...order,
          items: updatedItems
        };
      });
      setTableOrders(resetTempPayments);
    }
  };

  // Masa kapatma işlemi - yeniden kullanılabilir fonksiyon
  const closeTable = async (tableId: number): Promise<boolean> => {
    try {
      // Öncelikle siparişlerin durumlarını "tamamlandı" olarak güncelle
      for (const order of tableOrders) {
        try {
          await orderService.updateOrderStatus(order.id, 'completed');
          console.log(`Sipariş #${order.id} tamamlandı olarak işaretlendi`);
        } catch (orderUpdateError) {
          console.error(`Sipariş #${order.id} durumu güncellenirken hata:`, orderUpdateError);
          // Hata olsa bile diğer siparişleri güncellemeye devam et
        }
      }
      
      // Ardından masanın durumunu güncelle (siparişler ödendi, masa "boş" duruma geçecek)
      try {
        await tableService.updateTableStatus(tableId, { status: 'available' });
        console.log(`Masa #${tableId} boş duruma güncellendi`);
        
        // Masa listesini hemen güncelle
        await fetchTables();
        
        // İşlem başarılı mesajını ana ekrana dönmeden önce göster
        showAlert('Ödeme başarıyla alındı ve masa kapatıldı!', 'success');
        // Tüm ürünler ödendiyse masaya geri dön
        handleBackToTables();
        return true;
      } catch (tableUpdateError) {
        console.error(`Masa #${tableId} durumu güncellenirken hata:`, tableUpdateError);
        showAlert('Ödeme alındı fakat masa durumu güncellenemedi!', 'error');
        return false;
      }
    } catch (statusUpdateError) {
      console.error('Sipariş/masa durumu güncellenirken hata:', statusUpdateError);
      showAlert('Ödeme alındı fakat masa/sipariş durumu güncellenemedi!', 'error');
      return false;
    }
  };

  // İndirim butonlarını aç/kapa şeklinde çalıştır
  const handleDiscountToggle = (discountRate: number) => {
    if (discount === discountRate) {
      // Aynı butona tekrar tıklandığında indirim sıfırla
      setDiscount(0);
      setDiscountAmount(0);
    } else {
      // Farklı buton seçildiğinde o indirim oranını uygula
      setDiscount(discountRate);
      // Şu anki ödeme tutarına göre indirim miktarını hesapla, toplam tutara değil
      const currentPaymentAmount = paymentAmount > 0 ? paymentAmount : calculateRemainingAmount();
      setDiscountAmount(Number((currentPaymentAmount * discountRate / 100).toFixed(2)));
    }
  };

  // Geçici ödemeyi iptal etme
  const handleCancelTemporaryPayment = (item: OrderItem, orderId: number) => {
    if (!item.temporary_paid_quantity) return;
    
    // İlgili ürünün geçici ödeme miktarını sıfırla
    const updatedOrders = tableOrders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(orderItem => {
          if (orderItem.id === item.id) {
            return {
              ...orderItem,
              temporary_paid_quantity: 0
            };
          }
          return orderItem;
        });
        return {
          ...order,
          items: updatedItems
        };
      }
      return order;
    });
    
    // Sipariş state'ini güncelle
    setTableOrders(updatedOrders);
    
    // Ürünün ödeme tutarını hesaplanan toplam tutardan düş
    const unitPrice = item.unit_price || (item.total_price / item.quantity);
    const cancelAmount = unitPrice * item.temporary_paid_quantity;
    
    // Tahsil edilecek tutarı güncelle
    setPaymentAmount(Math.max(0, paymentAmount - cancelAmount));
    
    // Eğer iptal edilen ürün payment notes'da yer alıyorsa, o kısmı da kaldır
    const productNoteRegex = new RegExp(`${item.product_name} \\(${item.temporary_paid_quantity} adet\\)`, 'g');
    const updatedNotes = paymentNotes.replace(productNoteRegex, '').replace(/^, |, $/, '').replace(/, ,/g, ',');
    setPaymentNotes(updatedNotes);
    
    // Bildirim göster
    showAlert(`${item.product_name} için geçici ödeme iptal edildi.`, 'success');
  };

  // Tamamını öde fonksiyonu
  const handlePayAll = () => {
    // Kalan tutarı backend'den alarak hesapla
    const remaining = Number(calculateRemainingAmount());
    
    if (remaining <= 0) {
      showAlert('Ödenecek tutar kalmadı!', 'error');
      return;
    }
    
    // Tüm ürünlerin kalan miktarlarını temporary_paid_quantity'ye ata
    const updatedOrders = tableOrders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const paidQuantity = Number(item.paid_quantity || 0);
        const remainingQuantity = Number(item.quantity) - paidQuantity;
        return {
          ...item,
          temporary_paid_quantity: remainingQuantity > 0 ? remainingQuantity : 0
        };
      })
    }));
    
    // State'i güncelle
    setTableOrders(updatedOrders);
    
    setPaymentAmount(Number(remaining.toFixed(2)));
    setPaymentNotes('Tüm hesabın ödemesi');
    
    // İndirim tutarını güncelle (eğer indirim aktifse)
    if (discount > 0) {
      setDiscountAmount(Number((remaining * discount / 100).toFixed(2)));
    }
    
    // Ödeme modalını aç
    setOpenPaymentDialog(true);
  };

  // Yarısını öde fonksiyonu
  const handlePayHalf = () => {
    // Kalan tutarı backend'den alarak hesapla
    const remaining = Number(calculateRemainingAmount());
    
    if (remaining <= 0) {
      showAlert('Ödenecek tutar kalmadı!', 'error');
      return;
    }
    
    const halfAmount = remaining / 2;
    
    // Tüm ürünlerin kalan miktarlarının yarısını temporary_paid_quantity'ye ata
    const updatedOrders = tableOrders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const paidQuantity = Number(item.paid_quantity || 0);
        const remainingQuantity = Number(item.quantity) - paidQuantity;
        // Kalan miktarın yarısını al ve yukarı yuvarla
        const halfQuantity = Math.ceil(remainingQuantity / 2);
        return {
          ...item,
          temporary_paid_quantity: remainingQuantity > 0 ? halfQuantity : 0
        };
      })
    }));
    
    // State'i güncelle
    setTableOrders(updatedOrders);
    
    setPaymentAmount(Number(halfAmount.toFixed(2)));
    setPaymentNotes('Hesabın yarısının ödemesi');
    
    // İndirim tutarını güncelle (eğer indirim aktifse)
    if (discount > 0) {
      setDiscountAmount(Number((halfAmount * discount / 100).toFixed(2)));
    }
    
    // Ödeme modalını aç
    setOpenPaymentDialog(true);
  };

  // İndirim uygula fonksiyonu
  const handleApplyDiscount = async () => {
    if (!selectedTable || !activeTablePayment) {
      showAlert('Aktif masa ödemesi bulunamadı!', 'error');
      return;
    }

    // İndirim tutarını hesapla
    const discountRate = discount;
    const total = calculateTotalAmount();
    const discountAmountValue = (total * discountRate / 100);
    
    try {
      // İndirim için backend API çağrısı
      const response = await paymentService.applyTableDiscount(
        activeTablePayment.id, 
        {
          discount_rate: discountRate,
          discount_amount: Number(discountAmountValue.toFixed(2)),
          discount_reason: `Kasada indirim uygulandı (%${discountRate})`        }
      );
      
      // Başarılı ise, verileri güncelle
      await fetchTableOrders(selectedTable.id);
      
      // İndirim verisini sıfırla
      setDiscount(0);
      setDiscountAmount(0);
      
      // Başarı mesajı göster
      showAlert(`%${discountRate} indirim başarıyla uygulandı.`, 'success');
    } catch (error) {
      console.error('İndirim uygulanırken hata oluştu:', error);
      showAlert('İndirim uygulanırken bir hata oluştu!', 'error');
    }
  };

  // Hata/bilgi mesajı göster
  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  // Para birimi formatı
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '₺0,00';
    }
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(amount));
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {view === 'tables' ? 'Hesap İşlemleri' : 
          selectedTable ? `Masa ${selectedTable.number} - Hesap Detayı` : 'Hesap Detayı'}
      </Typography>

      {view === 'tables' ? (
        <Grid container spacing={3}>
          {/* Tüm Masalar */}
          <Grid item xs={12}>
            <Paper sx={{ width: '100%', p: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tüm Masalar
                </Typography>
                
                {loadingTables ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : tables.length === 0 ? (
                  <Alert severity="warning">Masa verisi bulunamadı!</Alert>
                ) : (
                  <Grid container spacing={2}>
                    {/* Önce dolu masalar */}
                    {tables
                      .filter((table: Table) => table.status === 'occupied')
                      .sort((a, b) => a.number - b.number)
                      .map(table => (
                      <Grid item xs={6} sm={3} md={2} key={table.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: selectedTable?.id === table.id ? '2px solid #1976d2' : 'none',
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: 3
                            }
                          }}
                          onClick={() => handleTableSelect(table)}
                        >
                          <Box sx={{ bgcolor: 'error.light', color: 'error.dark', p: 1, textAlign: 'center' }}>
                            <Typography variant="caption" fontWeight="bold">
                              DOLU
                            </Typography>
                          </Box>
                          <CardContent sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="h6" component="div">
                              Masa {table.number}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}

                    {/* Sonra boş masalar */}
                    {tables
                      .filter((table: Table) => table.status !== 'occupied')
                      .sort((a, b) => a.number - b.number)
                      .map(table => (
                      <Grid item xs={6} sm={3} md={2} key={table.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: selectedTable?.id === table.id ? '2px solid #1976d2' : 'none',
                            transition: 'transform 0.3s',
                            bgcolor: 'background.paper',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: 3
                            }
                          }}
                          onClick={() => handleTableSelect(table)}
                        >
                          <Box sx={{ bgcolor: 'success.light', color: 'success.dark', p: 1, textAlign: 'center' }}>
                            <Typography variant="caption" fontWeight="bold">
                              BOŞ
                            </Typography>
                          </Box>
                          <CardContent sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="h6" component="div">
                              Masa {table.number}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Sipariş Detayları Görünümü
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ width: '100%', p: 2 }}>
              <Box mb={2}>
                <Button 
                  variant="outlined" 
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBackToTables}
                >
                  Masalara Dön
                </Button>
              </Box>
              
              {loadingOrder ? (
                <Box display="flex" justifyContent="center" p={5}>
                  <CircularProgress />
                </Box>
              ) : tableOrders.length === 0 ? (
                <Alert severity="info">Bu masada aktif sipariş bulunmamaktadır.</Alert>
              ) : (
                <Box>
                  {/* Tüm Sipariş Öğeleri Birleştirilmiş Şekilde */}
                  <Grid container spacing={3}>
                    {/* Sol Sütun - Sipariş Detayları */}
                    <Grid item xs={12} md={7}>
                      <Box mb={3}>
                        <Typography variant="h6">
                          Masa {selectedTable?.number} Siparişleri
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tableOrders.length} aktif sipariş
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" gutterBottom>
                        Sipariş Ürünleri
                      </Typography>
                      
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Ürün</TableCell>
                              <TableCell align="center">Miktar</TableCell>
                              <TableCell align="right">Birim Fiyat</TableCell>
                              <TableCell align="right">Toplam</TableCell>
                              <TableCell align="center">Ödeme Durumu</TableCell>
                              <TableCell align="right">İşlem</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {/* Tüm siparişlerdeki ürünleri birleştir ve göster */}
                            {tableOrders
                              .sort((a, b) => a.id - b.id) // Sipariş ID'sine göre sırala
                              .flatMap(order => {
                              // Her bir sipariş için ürünleri dönüştür
                              if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
                                return []; // Sipariş içinde ürün yoksa boş dizi döndür
                              }
                              
                              // Siparişin ürünlerini döndür
                              return order.items.map((item) => {
                                const paidQuantity = item.paid_quantity || 0;
                                const temporaryPaidQuantity = item.temporary_paid_quantity || 0;
                                const totalPaidQuantity = Number(paidQuantity) + Number(temporaryPaidQuantity);
                                const remainingQuantity = item.quantity - paidQuantity;
                                
                                // Renk hesapla
                                const colorStatus = 
                                  totalPaidQuantity >= item.quantity ? 'success' :
                                  totalPaidQuantity > item.quantity * 0.6 ? 'info' :
                                  totalPaidQuantity > item.quantity * 0.3 ? 'warning' : 'error';
                                
                                return (
                                  <TableRow key={`${order.id}-${item.id}`} hover>
                                    <TableCell>
                                      {item.product_name}
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        Sipariş #{order.id}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">{item.quantity}</TableCell>
                                    <TableCell align="right">
                                      {item.unit_price ? formatCurrency(item.unit_price) : 
                                        formatCurrency(item.total_price / item.quantity)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {item.total_price ? formatCurrency(item.total_price) : 
                                        formatCurrency(item.unit_price * item.quantity)}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={`${totalPaidQuantity}/${item.quantity}`}
                                        color={colorStatus}
                                        size="small"
                                        sx={{ 
                                          position: 'relative',
                                          '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            bottom: 0,
                                            height: '3px',
                                            backgroundColor: 
                                              totalPaidQuantity >= item.quantity ? 'success.main' : 
                                              totalPaidQuantity > item.quantity * 0.6 ? 'info.main' :
                                              totalPaidQuantity > item.quantity * 0.3 ? 'warning.main' : 'error.main',
                                            borderRadius: '4px'
                                          }
                                        }}
                                      />
                                      {temporaryPaidQuantity > 0 && (
                                        <Typography variant="caption" display="block" color="info.main" style={{ marginTop: 4 }}>
                                          (Geçici: {temporaryPaidQuantity} adet)
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          startIcon={<PaymentIcon />}
                                          onClick={() => {
                                            // Ödeme için sipariş ve ürünü seç
                                            handleItemSelect({...item, id: item.id}, order.id);
                                          }}
                                          disabled={remainingQuantity <= 0}
                                        >
                                          Öde
                                        </Button>
                                        
                                        {temporaryPaidQuantity > 0 && (
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleCancelTemporaryPayment(item, order.id)}
                                          >
                                            İptal
                                          </Button>
                                        )}
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })}
                            
                            {/* Eğer hiç ürün yoksa bilgi mesajı göster */}
                            {tableOrders.every(order => !order.items || !Array.isArray(order.items) || order.items.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={6} align="center">
                                  <Alert severity="info" sx={{ my: 2 }}>
                                    Bu masada listelenecek ürün bulunmamaktadır. Yükleme işlemi devam ediyor olabilir.
                                  </Alert>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                    
                    {/* Sağ Sütun - Hesap Alma */}
                    <Grid item xs={12} md={5}>
                      <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.default' }}>
                        <Typography variant="h6" gutterBottom align="center">
                          Ödeme Bilgileri
                        </Typography>
                        
                        {/* Hesap Özeti */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography>Toplam Tutar:</Typography>
                            <Typography fontWeight="bold">
                              {formatCurrency(Number(calculateTotalAmount()))}
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography>Tahsil Edilen:</Typography>
                            <Typography fontWeight="bold" color="success.main">
                              {formatCurrency(Number(calculatePaidAmount()))}
                            </Typography>
                          </Stack>
                          
                          {calculateTemporaryPaidAmount() > 0 && (
                            <Stack direction="row" justifyContent="space-between" mb={1}>
                              <Typography>Geçici Tahsil:</Typography>
                              <Typography fontWeight="bold" color="info.main">
                                {formatCurrency(Number(calculateTemporaryPaidAmount()))}
                              </Typography>
                            </Stack>
                          )}
                          
                          <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography>Kalan Tutar:</Typography>
                            <Typography fontWeight="bold" color="error.main">
                              {formatCurrency(Number(calculateRemainingAmount()))}
                            </Typography>
                          </Stack>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography>Toplam İndirim:</Typography>
                            <Typography fontWeight="bold" color="warning.main">
                              {formatCurrency(activeTablePayment?.discount_amount || 0)}
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" justifyContent="space-between">
                            <Typography fontWeight="bold">Ödenecek Tutar:</Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                              {formatCurrency(paymentAmount > 0 ? paymentAmount - (discount > 0 ? discountAmount : 0) : calculateRemainingAmount())}
                            </Typography>
                          </Stack>
                        </Box>
                        
                        {/* Debug Bilgisi */}
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" fontSize="10px">
                            Debug: Sipariş Sayısı: {tableOrders.length}, Toplam Ürün: {tableOrders.reduce((count, order) => count + (order.items?.length || 0), 0)}
                          </Typography>
                          <Button 
                            size="small" 
                            variant="text" 
                            color="info"
                            onClick={() => {
                              console.log("DEBUG - Tüm masa siparişleri:", tableOrders);
                              console.log("DEBUG - Toplam tutar:", calculateTotalAmount());
                              console.log("DEBUG - Tahsil edilen:", calculatePaidAmount());
                              console.log("DEBUG - Kalan tutar:", calculateRemainingAmount());
                              showAlert('Debug bilgileri konsola yazdırıldı.', 'success');
                            }}
                            sx={{ fontSize: '10px', minWidth: '60px', p: 0 }}
                          >
                            Test
                          </Button>
                        </Box>
                        
                        {/* Tutar Girişi & Hesap Makinesi */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Tutar Girişi
                          </Typography>
                          <TextField
                            fullWidth
                            label="Tahsil Edilecek Tutar"
                            value={paymentAmount > 0 ? paymentAmount : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setPaymentAmount(0);
                              } else {
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue)) {
                                  setPaymentAmount(numValue);
                                }
                              }
                            }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                              endAdornment: discount > 0 ? (
                                <InputAdornment position="end">
                                  <Typography color="error.main" fontWeight="bold">
                                    -%{discount} ({formatCurrency(discountAmount)})
                                  </Typography>
                                </InputAdornment>
                              ) : null,
                            }}
                            sx={{ mb: 2 }}
                          />
                          
                          <Grid container spacing={1}>
                            {/* Numerik Tuş Takımı */}
                            <Grid item xs={8}>
                              <Grid container spacing={1}>
                                {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map((num: number) => (
                                  <Grid item xs={4} key={num}>
                                    <Button 
                                      variant="outlined" 
                                      fullWidth
                                      onClick={() => {
                                        const currentAmount = paymentAmount || 0;
                                        setPaymentAmount(currentAmount * 10 + num);
                                      }}
                                    >
                                      {num}
                                    </Button>
                                  </Grid>
                                ))}
                                <Grid item xs={8}>
                                  <Button 
                                    variant="outlined" 
                                    fullWidth 
                                    color="error"
                                    onClick={() => {
                                      // Tüm geçici ödemeleri temizle
                                      const resetTempPayments = tableOrders.map(order => {
                                        const updatedItems = order.items.map(item => ({
                                          ...item,
                                          temporary_paid_quantity: 0
                                        }));
                                        return {
                                          ...order,
                                          items: updatedItems
                                        };
                                      });
                                      setTableOrders(resetTempPayments);
                                      
                                      // Diğer değerleri sıfırla
                                      setPaymentAmount(0);
                                      setDiscount(0); // İndirimi sıfırla
                                      setDiscountAmount(0); // İndirim tutarını sıfırla
                                      setPaymentNotes(''); // Notları temizle
                                      
                                      // Bilgilendirme mesajı göster
                                      showAlert('Tüm geçici ödemeler ve tutarlar temizlendi.', 'success');
                                    }}
                                  >
                                    Temizle
                                  </Button>
                                </Grid>
                                <Grid item xs={4}>
                                  <Button 
                                    variant="outlined" 
                                    fullWidth
                                    onClick={() => {
                                      const currentAmount = paymentAmount || 0;
                                      setPaymentAmount(Math.floor(currentAmount / 10));
                                    }}
                                  >
                                    ←
                                  </Button>
                                </Grid>
                              </Grid>
                            </Grid>
                            
                            {/* İndirim Butonları */}
                            <Grid item xs={4}>
                              <Grid container spacing={1} direction="column" sx={{ height: '100%' }}>
                                <Grid item>
                                  <Button 
                                    variant={discount === 5 ? "contained" : "outlined"} 
                                    fullWidth
                                    color="warning"
                                    onClick={() => handleDiscountToggle(5)}
                                  >
                                    %5
                                  </Button>
                                </Grid>
                                <Grid item>
                                  <Button 
                                    variant={discount === 10 ? "contained" : "outlined"} 
                                    fullWidth
                                    color="warning"
                                    onClick={() => handleDiscountToggle(10)}
                                  >
                                    %10
                                  </Button>
                                </Grid>
                                <Grid item>
                                  <Button 
                                    variant={discount === 20 ? "contained" : "outlined"} 
                                    fullWidth
                                    color="warning"
                                    onClick={() => handleDiscountToggle(20)}
                                  >
                                    %20
                                  </Button>
                                </Grid>
                                <Grid item>
                                  <Button 
                                    variant={discount === 30 ? "contained" : "outlined"} 
                                    fullWidth
                                    color="warning"
                                    onClick={() => handleDiscountToggle(30)}
                                  >
                                    %30
                                  </Button>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Box>
                        
                        {/* Toplu İndirim Butonu - Tüm Masa Hesabına İndirim Uygulamak İçin */}
                        <Box sx={{ mt: 3, mb: 3 }}>
                          {discount > 0 && (
                            <Button
                              variant="contained"
                              color="warning"
                              fullWidth
                              onClick={handleApplyDiscount}
                              disabled={!activeTablePayment}
                            >
                              %{discount} İndirim Uygula (Tüm Masa)
                            </Button>
                          )}
                        </Box>
                        
                        {/* Hızlı Ödeme Butonları */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Hızlı Ödeme
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Button 
                                variant="contained" 
                                color="primary" 
                                fullWidth
                                onClick={handlePayAll}
                              >
                                Tamamını Öde
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button 
                                variant="contained" 
                                color="secondary" 
                                fullWidth
                                onClick={handlePayHalf}
                              >
                                Yarısını Öde
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                        
                        {/* Ödeme Tipi ve Ödeme Butonu */}
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Ödeme Tipi
                          </Typography>
                          <Grid container spacing={1} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Button 
                                variant={paymentType === 'cash' ? 'contained' : 'outlined'}
                                fullWidth
                                startIcon={<MoneyIcon />}
                                onClick={() => setPaymentType('cash')}
                              >
                                Nakit
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button 
                                variant={paymentType === 'credit_card' ? 'contained' : 'outlined'}
                                fullWidth
                                startIcon={<CreditCardIcon />}
                                onClick={() => setPaymentType('credit_card')}
                              >
                                Kart
                              </Button>
                            </Grid>
                          </Grid>
                          
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            size="large"
                            startIcon={<PaymentIcon />}
                            onClick={() => {
                              if (paymentAmount <= 0) {
                                showAlert('Tahsil edilecek tutar girilmedi!', 'error');
                                return;
                              }
                              
                              if (paymentAmount == 0) {
                                showAlert('Lütfen önce bir ürün seçin veya tutar girin.', 'error');
                                return;
                              }
                              
                              setOpenPaymentDialog(true);
                            }}
                            disabled={processingPayment}
                          >
                            {processingPayment ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              'Ödemeyi Tamamla'
                            )}
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Ürün Ödeme Dialog */}
      <Dialog
        open={openItemDialog}
        onClose={() => !processingPayment && setOpenItemDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Ürün Ödeme Miktarı
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedItem.product_name}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography>Birim Fiyat:</Typography>
                    <Typography fontWeight="bold">
                      {selectedItem.unit_price ? formatCurrency(selectedItem.unit_price) : 
                       formatCurrency(selectedItem.total_price / selectedItem.quantity)}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography>Toplam Miktar:</Typography>
                    <Typography fontWeight="bold">
                      {selectedItem.quantity} adet
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography>Ödenmiş Miktar:</Typography>
                    <Typography fontWeight="bold">
                      {selectedItem.paid_quantity || 0} adet
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography>Kalan Miktar:</Typography>
                    <Typography fontWeight="bold">
                      {selectedItem.quantity - (selectedItem.paid_quantity || 0)} adet
                    </Typography>
                  </Stack>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Ödenecek Miktar</InputLabel>
                    <Select
                      value={payQuantity}
                      label="Ödenecek Miktar"
                      onChange={(e) => setPayQuantity(Number(e.target.value))}
                    >
                      {Array.from({ length: selectedItem.quantity - (selectedItem.paid_quantity || 0) - (selectedItem.temporary_paid_quantity || 0) }, (_, i) => i + 1).map(qty => (
                        <MenuItem key={qty} value={qty}>{qty} adet</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
                    <Typography>Ödenecek Tutar:</Typography>
                    <Typography variant="h5" color="primary">
                      {formatCurrency((selectedItem.unit_price || (selectedItem.total_price / selectedItem.quantity)) * payQuantity)}
                    </Typography>
                  </Box>
                  
                  {(selectedItem.temporary_paid_quantity || 0) > 0 && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="body2" color="info.dark">
                        Bu ürün için zaten {(selectedItem.temporary_paid_quantity || 0)} adet geçici ödeme bulunmaktadır.
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenItemDialog(false)} 
            disabled={processingPayment}
          >
            İptal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleItemPayment}
            disabled={processingPayment || payQuantity <= 0}
          >
            Ödeme Tutarını Aktar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Ödeme Dialog */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => !processingPayment && setOpenPaymentDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Ödeme Onayı
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 1 }}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography fontWeight="bold">Ödeme Tipi:</Typography>
              <Chip 
                icon={paymentType === 'cash' ? <MoneyIcon /> : <CreditCardIcon />}
                label={paymentType === 'cash' ? 'Nakit' : 'Kredi Kartı'}
                color={paymentType === 'cash' ? 'success' : 'info'}
              />
            </Stack>
            
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography fontWeight="bold">Tahsil Edilecek Tutar:</Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(paymentAmount)}
              </Typography>
            </Stack>
            
            {discount > 0 && (
              <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography fontWeight="bold">Bu İşlemde İndirim:</Typography>
                <Typography color="warning.main">
                  %{discount} ({formatCurrency(discountAmount)})
                </Typography>
              </Stack>
            )}
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Ödemeyi onaylamak istediğinizden emin misiniz?
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenPaymentDialog(false)} 
            disabled={processingPayment}
            color="error"
            variant="outlined"
          >
            Hayır
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleProcessPayment}
            disabled={processingPayment}
            startIcon={processingPayment ? <CircularProgress size={24} /> : <CheckIcon />}
          >
            Evet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Uyarı Snackbar */}
      <Snackbar
        open={openAlert}
        autoHideDuration={6000}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenAlert(false)} 
          severity={alertSeverity}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Cashier; 
