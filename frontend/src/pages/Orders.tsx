import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import EditIcon from '@mui/icons-material/Edit';
import { orderService, tableService } from '../services/api';
import { useSnackbar } from 'notistack';
import socketService from '../services/socket.service';

// Sipariş durumları
enum OrderStatus {
  NEW = 'created',
  PREPARING = 'in_progress',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELED = 'cancelled',
  COMPLETED = 'completed'
}

interface Table {
  id: number;
  name: string;
  status: string;
  is_active: boolean;
}

// Sipariş öğesi
interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  product_options?: { option_name: string; option_value: string; price_modifier: number }[];
}

// Sipariş
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
}

// Örnek veriler
const mockOrders: Order[] = [
  {
    id: 101,
    table_id: 2,
    table_number: 2,
    status: OrderStatus.PREPARING,
    total_amount: 145.70,
    created_at: '2023-05-10T14:30:00',
    updated_at: '2023-05-10T14:35:00',
    customer_count: 3,
    staff_id: 1,
    staff_name: 'Mehmet Yılmaz',
    items: [
      { id: 1, product_id: 1, product_name: 'Filtre Kahve', quantity: 2, unit_price: 35.90, total_price: 71.80 },
      { id: 2, product_id: 5, product_name: 'Cheesecake', quantity: 1, unit_price: 55.90, total_price: 55.90 },
      { id: 3, product_id: 2, product_name: 'Espresso', quantity: 1, unit_price: 18.00, total_price: 18.00 }
    ]
  },
  {
    id: 102,
    table_id: 4,
    table_number: 4,
    status: OrderStatus.NEW,
    total_amount: 250.50,
    created_at: '2023-05-10T14:40:00',
    updated_at: '2023-05-10T14:40:00',
    customer_count: 5,
    staff_id: 2,
    staff_name: 'Ayşe Kaya',
    items: [
      { id: 4, product_id: 3, product_name: 'Latte', quantity: 3, unit_price: 40.90, total_price: 122.70 },
      { id: 5, product_id: 4, product_name: 'Türk Çayı', quantity: 2, unit_price: 15.90, total_price: 31.80 },
      { id: 6, product_id: 5, product_name: 'Cheesecake', quantity: 2, unit_price: 55.90, total_price: 111.80 }
    ]
  },
  {
    id: 103,
    table_id: 8,
    table_number: 8,
    status: OrderStatus.READY,
    total_amount: 356.00,
    created_at: '2023-05-10T14:15:00',
    updated_at: '2023-05-10T14:25:00',
    customer_count: 7,
    staff_id: 1,
    staff_name: 'Mehmet Yılmaz',
    notes: 'Terasta servis edilecek',
    items: [
      { id: 7, product_id: 1, product_name: 'Filtre Kahve', quantity: 4, unit_price: 35.90, total_price: 143.60 },
      { id: 8, product_id: 3, product_name: 'Latte', quantity: 3, unit_price: 40.90, total_price: 122.70 },
      { id: 9, product_id: 5, product_name: 'Cheesecake', quantity: 2, unit_price: 55.90, total_price: 111.80 }
    ]
  }
];

const Orders: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openOrderDialog, setOpenOrderDialog] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const { enqueueSnackbar } = useSnackbar();
  const [tableNames, setTableNames] = useState<{ [key: string]: string }>({});

  // Masa isimlerini getir
  const fetchTableNames = async () => {
    try {
      const response = await tableService.getTables(true);
      const tableMapping: { [key: string]: string } = {};
      response.data.forEach((table: Table) => {
        tableMapping[table.id] = table.name;
      });
      setTableNames(tableMapping);
    } catch (error) {
      console.error('Masa isimleri alınırken hata:', error);
    }
  };

  // İlk yüklemede masa isimlerini getir
  useEffect(() => {
    fetchTableNames();
  }, []);

  // Siparişleri getir
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      
      const processedOrders = response.data.map((order: any) => ({
        id: order.id || 0,
        table_id: order.table_id || 0,
        table_number: tableNames[order.table_id] || `Masa ${order.table_id}`,
        status: order.status || OrderStatus.NEW,
        total_amount: order.total_amount || 0,
        created_at: order.created_at || new Date().toISOString(),
        updated_at: order.updated_at || new Date().toISOString(),
        items: Array.isArray(order.items) ? order.items : [],
        customer_count: order.customer_count,
        staff_id: order.staff_id,
        staff_name: order.staff_name,
        notes: order.notes
      }));
      
      setOrders(processedOrders);
      filterOrders(processedOrders);
    } catch (error) {
      console.error('Siparişler alınırken hata oluştu:', error);
      enqueueSnackbar('Siparişler alınırken bir hata oluştu', { variant: 'error' });
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Socket.IO bağlantısı ve event dinleyicileri
  useEffect(() => {
    // İlk yükleme
    fetchOrders();
    
    // Socket.IO bağlantısını başlat
    socketService.connect();
    socketService.joinOrdersRoom();

    // Socket.IO event dinleyicileri
    const handleNewOrder = (order: any) => {
      console.log('Yeni sipariş alındı:', order);
      setOrders(prevOrders => {
        const processedOrder = {
          ...order,
          table_number: tableNames[order.table_id] || `Masa ${order.table_id}`
        };
        const newOrders = [processedOrder, ...prevOrders];
        filterOrders(newOrders);
        return newOrders;
      });
      enqueueSnackbar('Yeni sipariş alındı!', { variant: 'info' });
    };

    const handleOrderUpdated = (updatedOrder: any) => {
      console.log('Sipariş güncellendi:', updatedOrder);
      setOrders(prevOrders => {
        const processedOrder = {
          ...updatedOrder,
          table_number: tableNames[updatedOrder.table_id] || `Masa ${updatedOrder.table_id}`
        };
        const newOrders = prevOrders.map(order => 
          order.id === updatedOrder.id ? processedOrder : order
        );
        filterOrders(newOrders);
        return newOrders;
      });
    };

    const handleOrderDeleted = (orderId: number) => {
      console.log('Sipariş silindi:', orderId);
      setOrders(prevOrders => {
        const newOrders = prevOrders.filter(order => order.id !== orderId);
        filterOrders(newOrders);
        return newOrders;
      });
    };

    // Event dinleyicilerini ekle
    socketService.onNewOrder(handleNewOrder);
    socketService.onOrderUpdated(handleOrderUpdated);
    socketService.onOrderDeleted(handleOrderDeleted);

    // Cleanup
    return () => {
      console.log('Socket.IO bağlantısı kapatılıyor...');
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, [tableNames]); // tableNames'i dependency olarak ekledik

  // Tab değişikliğinde ve arama sorgusunda filtreleme yap
  useEffect(() => {
    filterOrders(orders);
  }, [tabValue, searchQuery]);

  // Filtreleme fonksiyonu
  const filterOrders = (ordersList: Order[]) => {
    console.log('Filtreleme yapılıyor:', { ordersList, tabValue, searchQuery });
    
    let filtered = [...ordersList];

    // Tab değerine göre filtrele
    switch (tabValue) {
      case 0: // Tümü
        filtered = filtered.filter(order => 
          order.status !== OrderStatus.COMPLETED && 
          order.status !== OrderStatus.CANCELED &&
          order.status !== OrderStatus.DELIVERED
        );
        break;
      case 1: // Yeni
        filtered = filtered.filter(order => order.status === OrderStatus.NEW);
        break;
      case 2: // Hazırlanıyor
        filtered = filtered.filter(order => order.status === OrderStatus.PREPARING);
        break;
      case 3: // Hazır
        filtered = filtered.filter(order => order.status === OrderStatus.READY);
        break;
      case 4: // Teslim Edildi
        filtered = filtered.filter(order => order.status === OrderStatus.DELIVERED);
        break;
      case 5: // Tamamlanan
        filtered = filtered.filter(order => order.status === OrderStatus.COMPLETED);
        break;
      case 6: // İptal Edilen
        filtered = filtered.filter(order => order.status === OrderStatus.CANCELED);
        break;
    }

    // Arama sorgusuna göre filtrele
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.table_number?.toString().toLowerCase().includes(query) ||
        order.items.some(item => 
          item.product_name.toLowerCase().includes(query)
        ) ||
        order.staff_name?.toLowerCase().includes(query) ||
        order.id.toString().includes(query)
      );
    }

    console.log('Filtrelenmiş siparişler:', filtered);
    setFilteredOrders(filtered);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOpenOrderDialog(true);
  };

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      // API ile durumu güncelle
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Başarılı ise UI'ı direkt güncelleyelim, fetchOrders çağırmak yerine
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order
      );
      
      setOrders(updatedOrders);
      // filteredOrders'ı da güncelle
      filterOrders(updatedOrders);
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, updated_at: new Date().toISOString() });
      }
      
      // Dialog'u kapat
      setOpenOrderDialog(false);
      
      // Başarı mesajı göster
      setAlertSeverity('success');
      setAlertMessage(`Sipariş durumu başarıyla güncellendi: ${
        newStatus === OrderStatus.PREPARING ? 'Hazırlanıyor' :
        newStatus === OrderStatus.READY ? 'Hazır' :
        newStatus === OrderStatus.DELIVERED ? 'Teslim Edildi' :
        newStatus === OrderStatus.COMPLETED ? 'Tamamlandı' :
        newStatus === OrderStatus.CANCELED ? 'İptal Edildi' : 
        'Güncellendi'
      }`);
      setOpenAlert(true);
      
    } catch (error) {
      console.error('Sipariş durumu güncellenirken hata oluştu:', error);
      setAlertSeverity('error');
      setAlertMessage('Sipariş durumu güncellenirken bir hata oluştu!');
      setOpenAlert(true);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      // API ile siparişi iptal et
      await orderService.cancelOrder(orderId);
      
      // Siparişi UI'dan kaldırmak yerine durumunu güncelle
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: OrderStatus.CANCELED, updated_at: new Date().toISOString() } : order
      );
      
      setOrders(updatedOrders);
      // filteredOrders'ı da güncelle
      filterOrders(updatedOrders);
      
      // Dialog'u kapat
      setOpenOrderDialog(false);
      
      // Başarı mesajı göster
      setAlertSeverity('success');
      setAlertMessage('Sipariş başarıyla iptal edildi');
      setOpenAlert(true);
      
    } catch (error) {
      console.error('Sipariş iptal edilirken hata oluştu:', error);
      setAlertSeverity('error');
      setAlertMessage('Sipariş iptal edilirken bir hata oluştu!');
      setOpenAlert(true);
    }
  };

  const handleEditOrder = (order: Order) => {
    // Sipariş düzenleme sayfasına yönlendirme yapıyoruz, sipariş ID'sini de ekleyelim
    window.location.href = `/new-order?table=${order.table_id}&order=${order.id}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  };

  const getStatusChip = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return <Chip label="Yeni" color="primary" size="small" />;
      case OrderStatus.PREPARING:
        return <Chip label="Hazırlanıyor" color="secondary" size="small" />;
      case OrderStatus.READY:
        return <Chip label="Hazır" color="success" size="small" />;
      case OrderStatus.DELIVERED:
        return <Chip label="Teslim Edildi" color="info" size="small" />;
      case OrderStatus.COMPLETED:
        return <Chip label="Tamamlandı" color="default" size="small" />;
      case OrderStatus.CANCELED:
        return <Chip label="İptal Edildi" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const renderOrderDetails = (order: Order) => {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.1)', pb: 1 }}>
                Sipariş Bilgileri
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Masa</Typography>
                  <Typography variant="body1">{order.table_number || order.table_id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Tarih</Typography>
                  <Typography variant="body1">{formatDate(order.created_at)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Sipariş Numarası</Typography>
                  <Typography variant="body1">#{order.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Müşteri Sayısı</Typography>
                  <Typography variant="body1">{order.customer_count || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Personel</Typography>
                  <Typography variant="body1">{order.staff_name || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Toplam Tutar</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total_amount)}
                  </Typography>
                </Grid>
              </Grid>
              
              {order.notes && (
                <Box sx={{ mt: 2, bgcolor: 'info.light', p: 1, borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">Sipariş Notu</Typography>
                  <Typography variant="body1">{order.notes}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.1)', pb: 1 }}>
                Sipariş Durumu
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <Chip 
                  label="Yeni" 
                  color={order.status === OrderStatus.NEW ? 'warning' : 'default'} 
                  variant={order.status === OrderStatus.NEW ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
                <Chip 
                  label="Hazırlanıyor" 
                  color={order.status === OrderStatus.PREPARING ? 'secondary' : 'default'} 
                  variant={order.status === OrderStatus.PREPARING ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
                <Chip 
                  label="Hazır" 
                  color={order.status === OrderStatus.READY ? 'success' : 'default'} 
                  variant={order.status === OrderStatus.READY ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
                <Chip 
                  label="Teslim Edildi" 
                  color={order.status === OrderStatus.DELIVERED ? 'primary' : 'default'} 
                  variant={order.status === OrderStatus.DELIVERED ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
                {order.status === OrderStatus.CANCELED && (
                  <Chip 
                    label="İptal Edildi" 
                    color="error" 
                    sx={{ mb: 1 }}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2, width: '100%' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.1)', pb: 1 }}>
                Sipariş İçeriği
              </Typography>
              
              <TableContainer component={Box} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ürün</TableCell>
                      <TableCell align="center">Adet</TableCell>
                      <TableCell align="right">Birim Fiyat</TableCell>
                      <TableCell align="right">Toplam</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items && order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body1">{item.product_name}</Typography>
                          {item.notes && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              Not: {item.notes}
                            </Typography>
                          )}
                          {item.product_options && item.product_options.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              {item.product_options.map((option, optIndex) => (
                                <Typography 
                                  key={optIndex} 
                                  variant="caption" 
                                  color="textSecondary" 
                                  display="block"
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  {option.option_name}: {option.option_value}
                                  {option.price_modifier > 0 && ` (+${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(option.price_modifier)})`}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.unit_price)}
                        </TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.total_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} />
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        Toplam:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total_amount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Siparişler
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={
            <Box display="flex" alignItems="center">
              Aktif Siparişler
              <Chip 
                label={orders.filter(o => 
                  o.status !== OrderStatus.COMPLETED && 
                  o.status !== OrderStatus.CANCELED
                ).length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1, minWidth: 28 }}
              />
            </Box>
          } />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Yeni
                <Chip 
                  label={orders.filter(o => o.status === OrderStatus.NEW).length} 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1, minWidth: 28 }}
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Hazırlanıyor
                <Chip 
                  label={orders.filter(o => o.status === OrderStatus.PREPARING).length} 
                  size="small" 
                  color="secondary" 
                  sx={{ ml: 1, minWidth: 28 }}
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Hazır
                <Chip 
                  label={orders.filter(o => o.status === OrderStatus.READY).length} 
                  size="small" 
                  color="success" 
                  sx={{ ml: 1, minWidth: 28 }}
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Teslim Edildi
                <Chip 
                  label={orders.filter(o => o.status === OrderStatus.DELIVERED).length} 
                  size="small" 
                  color="info" 
                  sx={{ ml: 1, minWidth: 28 }}
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Tamamlanan
                <Chip 
                  label={orders.filter(o => o.status === OrderStatus.COMPLETED).length} 
                  size="small" 
                  color="default" 
                  sx={{ ml: 1, minWidth: 28 }}
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                İptal Edilen
                <Chip 
                  label={orders.filter(o => o.status === OrderStatus.CANCELED).length} 
                  size="small" 
                  color="error" 
                  sx={{ ml: 1, minWidth: 28 }}
                />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          size="small"
          placeholder="Sipariş ara..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Sipariş No</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Masa</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Durum</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tarih</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Toplam</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4} textAlign="center">
                      <Typography variant="body1" color="textSecondary" gutterBottom>
                        Sipariş bulunamadı
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Seçilen kriterlere uygun sipariş kaydı mevcut değil
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    hover
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewOrder(order)}
                  >
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">#{order.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography>{order.table_number}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getStatusChip(order.status as OrderStatus)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{formatDate(order.created_at)}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(order.created_at).toLocaleTimeString('tr-TR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold" color="primary">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total_amount)}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {order.items?.map((item, index) => (
                          <Box key={index} sx={{ 
                            borderLeft: '2px solid rgba(0,0,0,0.1)', 
                            pl: 1, 
                            py: 0.5,
                            mb: index < order.items.length - 1 ? 1 : 0 
                          }}>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'medium' }}>
                              {item.quantity}x {item.product_name}
                            </Typography>
                            {item.notes && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                Not: {item.notes}
                              </Typography>
                            )}
                            {item.product_options?.map((option, optIndex) => (
                              <Typography 
                                key={optIndex} 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ display: 'block', fontSize: '0.7rem' }}
                              >
                                {option.option_name}: {option.option_value}
                                {option.price_modifier > 0 && ` (+${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(option.price_modifier)})`}
                              </Typography>
                            ))}
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(order);
                          }}
                          title="Detayları Görüntüle"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Sipariş Düzenleme Butonu - sadece yeni veya hazırlanıyor durumundaysa */}
                        {(order.status === OrderStatus.NEW || order.status === OrderStatus.PREPARING) && (
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrder(order);
                            }}
                            title="Siparişi Düzenle"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        
                        {order.status === OrderStatus.NEW && (
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(order.id, OrderStatus.PREPARING);
                            }}
                            title="Hazırlanıyor Olarak İşaretle"
                          >
                            <CheckCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                        
                        {(order.status === OrderStatus.NEW || order.status === OrderStatus.PREPARING) && (
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order.id);
                            }}
                            title="Siparişi İptal Et"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Sipariş Detay Dialog */}
      <Dialog 
        open={openOrderDialog} 
        onClose={() => setOpenOrderDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Sipariş Detayı - #{selectedOrder?.id}
            </Typography>
            {selectedOrder && (
              <Chip 
                label={
                  selectedOrder.status === OrderStatus.NEW ? 'Yeni' :
                  selectedOrder.status === OrderStatus.PREPARING ? 'Hazırlanıyor' :
                  selectedOrder.status === OrderStatus.READY ? 'Hazır' :
                  selectedOrder.status === OrderStatus.DELIVERED ? 'Teslim Edildi' :
                  selectedOrder.status === OrderStatus.COMPLETED ? 'Tamamlandı' :
                  selectedOrder.status === OrderStatus.CANCELED ? 'İptal Edildi' : 
                  selectedOrder.status
                }
                color={
                  selectedOrder.status === OrderStatus.NEW ? 'warning' :
                  selectedOrder.status === OrderStatus.PREPARING ? 'secondary' :
                  selectedOrder.status === OrderStatus.READY ? 'success' :
                  selectedOrder.status === OrderStatus.DELIVERED || selectedOrder.status === OrderStatus.COMPLETED ? 'primary' :
                  'error'
                }
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && renderOrderDetails(selectedOrder)}
        </DialogContent>
        <DialogActions>
          {selectedOrder && (
            <>
              <Button 
                startIcon={<LocalPrintshopIcon />}
                onClick={() => console.log('Sipariş yazdırılıyor...')}
              >
                Yazdır
              </Button>
              
              {/* Düzenleme butonu ekleyelim */}
              {(selectedOrder.status === OrderStatus.NEW || selectedOrder.status === OrderStatus.PREPARING) && (
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => {
                    setOpenOrderDialog(false);
                    handleEditOrder(selectedOrder);
                  }}
                >
                  Düzenle
                </Button>
              )}
              
              {selectedOrder.status === OrderStatus.NEW && (
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={() => handleUpdateStatus(selectedOrder.id, OrderStatus.PREPARING)}
                >
                  Hazırlanıyor
                </Button>
              )}
              
              {selectedOrder.status === OrderStatus.PREPARING && (
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => handleUpdateStatus(selectedOrder.id, OrderStatus.READY)}
                >
                  Hazır
                </Button>
              )}
              
              {selectedOrder.status === OrderStatus.READY && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleUpdateStatus(selectedOrder.id, OrderStatus.DELIVERED)}
                >
                  Teslim Edildi
                </Button>
              )}
              
              {(selectedOrder.status === OrderStatus.NEW || selectedOrder.status === OrderStatus.PREPARING) && (
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                >
                  İptal Et
                </Button>
              )}
            </>
          )}
          <Button onClick={() => setOpenOrderDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
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

export default Orders; 