import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TableBarIcon from '@mui/icons-material/TableBar';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import { useNavigate } from 'react-router-dom';
import { paymentService, orderService, tableService, inventoryService } from '../services/api';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// API Response Types
interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Table {
  id: number;
  status: string;
  name: string;
}

interface Order {
  id: number;
  status: string;
  table_id: string;
  table_number: string;
  items: OrderItem[];
  created_at: string;
  total: number;
}

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  min_quantity: number;
}

interface DailySalesReport {
  date: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  payment_methods: {
    cash: number;
    credit_card: number;
    debit_card: number;
    other: number;
  };
  hourly_sales: {
    hour: number;
    sales: number;
    orders: number;
  }[];
  top_products: {
    product_id: number;
    product_name: string;
    quantity: number;
    total_sales: number;
  }[];
}

interface ApiResponse<T> {
  data: T;
}

interface WaiterRequest {
  id: number;
  table_id: number;
  status: 'pending' | 'done';
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  salesSummary: {
    today: number;
    total_orders: number;
  };
  activeOrders: {
    id: number;
    table: string;
    status: string;
    items: number;
    itemsSummary: string;
    total: number;
    time: string;
  }[];
  lowStockItems: {
    id: number;
    name: string;
    quantity: number;
    min_quantity: number;
  }[];
  waiterRequests: {
    id: number;
    table_id: number;
    status: string;
    time: string;
  }[];
  tables: {
    total: number;
    occupied: number;
    free: number;
  };
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchWaiterRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/waiter-calls`);
      if (!response.ok) {
        throw new Error('Garson istekleri yüklenemedi');
      }
      const waiterRequests = await response.json();
      return waiterRequests.map((request: WaiterRequest) => ({
        id: request.id,
        table_id: request.table_id,
        status: request.status === 'pending' ? 'beklemede' : 'tamamlandı',
        time: formatOrderTime(request.created_at)
      }));
    } catch (error) {
      console.error('Garson istekleri yüklenirken hata:', error);
      return [];
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Bugünün tarihini al
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Paralel olarak tüm verileri çek
      const [salesReport, orders, tables, lowStock, waiterRequests] = await Promise.all([
        paymentService.getDailySalesReport(todayStr) as Promise<ApiResponse<DailySalesReport>>,
        orderService.getOrders() as Promise<ApiResponse<Order[]>>,
        tableService.getTables(true) as Promise<ApiResponse<Table[]>>,
        inventoryService.getLowStockItems() as Promise<ApiResponse<InventoryItem[]>>,
        fetchWaiterRequests()
      ]);

      // Masa ID'lerini ve isimlerini bir obje olarak tut
      const tableNames: { [key: string]: string } = {};
      tables.data.forEach(table => {
        tableNames[table.id] = table.name;
      });

      console.log('Masa Listesi:', {
        masalar: tableNames,
        tables: tables.data
      });

      // Aktif siparişleri filtrele (yeni, hazırlanıyor, hazır durumundakiler)
      const activeOrders = orders.data
        .filter((order: Order) => ['created', 'in_progress', 'ready'].includes(order.status))
        .map((order: Order) => {
          // Masa adını bul
          const tableName = tableNames[order.table_id];
          
          return {
            id: order.id,
            table: tableName || `Masa ${order.table_number}`,
            status: order.status === 'created' ? 'yeni' : 
                   order.status === 'in_progress' ? 'hazırlanıyor' : 'hazır',
            items: order.items?.length || 0,
            itemsSummary: order.items?.map(item => `${item.quantity}x ${item.product_name}`).join(', ') || '',
            total: order.total || 0,
            time: formatOrderTime(order.created_at)
          };
        });

      console.log('Masa ve Sipariş Eşleştirmesi:', {
        masalar: tableNames,
        aktifSiparişler: activeOrders.map(order => ({
          id: order.id,
          masaAdı: order.table,
          orijinalTableId: orders.data.find(o => o.id === order.id)?.table_id,
          masaBilgisi: tableNames[orders.data.find(o => o.id === order.id)?.table_id || '']
        }))
      });

      setData({
        salesSummary: {
          today: salesReport.data.total_sales || 0,
          total_orders: salesReport.data.total_orders || 0
        },
        activeOrders,
        lowStockItems: lowStock.data.map((item: InventoryItem) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          min_quantity: item.min_quantity
        })),
        waiterRequests: waiterRequests,
        tables: {
          total: tables.data.length,
          occupied: tables.data.filter((table: Table) => table.status !== 'available').length,
          free: tables.data.filter((table: Table) => table.status === 'available').length
        }
      });

    } catch (error) {
      console.error('Dashboard verisi yüklenirken hata:', error);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Sipariş zamanını formatla
  const formatOrderTime = (dateString: string) => {
    const orderDate = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'şimdi';
    if (diffMinutes < 60) return `${diffMinutes} dk önce`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} saat önce`;
  };

  const handleWaiterRequest = async (id: number, status: 'done') => {
    try {
      const response = await fetch(`${API_URL}/api/v1/waiter-calls/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Durum güncellenemedi');
      }
      // Dashboard verilerini yeniden yükle
      fetchDashboardData();
    } catch (error) {
      console.error('Garson isteği güncellenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Socket.IO bağlantısını başlat
    const socket = io(API_URL);
    socket.emit('join-waiter-calls-room');

    // Garson çağırma bildirimlerini dinle
    socket.on('waiterRequest', () => {
      // Yeni garson çağrısı geldiğinde dashboard'ı güncelle
      fetchDashboardData();
    });
    
    // Her 1 dakikada bir güncelle
    const interval = setInterval(fetchDashboardData, 60000);
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Veriler yüklenemedi'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            height: '100%'
          }}>
            <CardContent>
              <RestaurantIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.salesSummary.today)}
              </Typography>
              <Typography variant="body2">
                Bugünkü Satış
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
            height: '100%'
          }}>
            <CardContent>
              <TableBarIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {data.tables.occupied} / {data.tables.total}
              </Typography>
              <Typography variant="body2">
                Dolu Masa
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            height: '100%'
          }}>
            <CardContent>
              <PointOfSaleIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {data.activeOrders.length}
              </Typography>
              <Typography variant="body2">
                Aktif Sipariş
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            bgcolor: 'error.main',
            color: 'error.contrastText',
            height: '100%'
          }}>
            <CardContent>
              <InventoryIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {data.lowStockItems.length}
              </Typography>
              <Typography variant="body2">
                Düşük Stok Ürün
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            bgcolor: 'info.main',
            color: 'info.contrastText',
            height: '100%',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/waiter-requests')}
          >
            <CardContent>
              <NotificationImportantIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {data.waiterRequests.filter(r => r.status === 'beklemede').length}
              </Typography>
              <Typography variant="body2">
                Garson Çağrısı
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          {/* Boş alan - gelecekte başka bir kart eklenebilir */}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Aktif Siparişler
            </Typography>
            <List>
              {data.activeOrders.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Aktif sipariş bulunmuyor" />
                </ListItem>
              ) : (
                data.activeOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <ListItem
                      button
                      onClick={() => navigate('/orders')}
                      secondaryAction={
                        <Button 
                          variant="outlined" 
                          size="small"
                          color={
                            order.status === 'yeni' ? 'primary' :
                            order.status === 'hazırlanıyor' ? 'secondary' : 'success'
                          }
                        >
                          {order.status.toUpperCase()}
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={`${order.table}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {order.itemsSummary}
                            </Typography>
                            <br />
                            {order.time} - {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total)}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Düşük Stok Ürünleri
            </Typography>
            <List>
              {data.lowStockItems.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Düşük stokta ürün bulunmuyor" />
                </ListItem>
              ) : (
                data.lowStockItems.map((item) => (
                  <div key={item.id}>
                    <ListItem
                      button
                      onClick={() => navigate('/inventory')}
                      secondaryAction={
                        <Button 
                          variant="outlined" 
                          size="small"
                          color="error"
                        >
                          Stok Ekle
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={item.name}
                        secondary={`Mevcut: ${item.quantity} (Min: ${item.min_quantity})`}
                      />
                    </ListItem>
                    <Divider />
                  </div>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <NotificationImportantIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Garson Çağırma İstekleri
            </Typography>
            <List>
              {data.waiterRequests.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Aktif garson çağrısı bulunmuyor" />
                </ListItem>
              ) : (
                data.waiterRequests.map((request) => (
                  <div key={request.id}>
                    <ListItem
                      secondaryAction={
                        request.status === 'beklemede' ? (
                          <Button 
                            variant="contained" 
                            size="small"
                            color="success"
                            onClick={() => handleWaiterRequest(request.id, 'done')}
                          >
                            Tamamla
                          </Button>
                        ) : (
                          <Chip
                            label="Tamamlandı"
                            color="success"
                            size="small"
                          />
                        )
                      }
                    >
                      <ListItemText
                        primary={`Masa ${request.table_id}`}
                        secondary={
                          <div>
                            <Chip
                              label={request.status}
                              color={request.status === 'beklemede' ? 'warning' : 'success'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            {request.time}
                          </div>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </div>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 