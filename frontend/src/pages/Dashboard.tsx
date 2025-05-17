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
  Alert
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TableBarIcon from '@mui/icons-material/TableBar';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useNavigate } from 'react-router-dom';
import { paymentService, orderService, tableService, inventoryService } from '../services/api';

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Bugünün tarihini al
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Paralel olarak tüm verileri çek
      const [salesReport, orders, tables, lowStock] = await Promise.all([
        paymentService.getDailySalesReport(todayStr) as Promise<ApiResponse<DailySalesReport>>,
        orderService.getOrders() as Promise<ApiResponse<Order[]>>,
        tableService.getTables(true) as Promise<ApiResponse<Table[]>>,
        inventoryService.getLowStockItems() as Promise<ApiResponse<InventoryItem[]>>
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

  useEffect(() => {
    fetchDashboardData();
    
    // Her 1 dakikada bir güncelle
    const interval = setInterval(fetchDashboardData, 60000);
    
    return () => clearInterval(interval);
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
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} md={6}>
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
        
        <Grid item xs={12} md={6}>
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
                  <React.Fragment key={item.id}>
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
                  </React.Fragment>
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