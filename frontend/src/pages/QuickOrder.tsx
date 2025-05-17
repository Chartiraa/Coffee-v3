import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Badge,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import { menuService, tableService, orderService } from '../services/api';

// Enum for order status
enum OrderStatus {
  NEW = 'new',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELED = 'canceled'
}

// Interfaces
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url: string;
  is_active: boolean;
  preparation_time: number;
  is_available: boolean;
}

interface Category {
  id: number;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface Cart {
  table_id: number;
  items: OrderItem[];
  customer_count: number;
  notes?: string;
  total_amount: number;
}

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
  active: boolean;
  location?: string;
}

interface Order {
  id: number;
  table_id: number;
  table_number: number;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer_count?: number;
  notes?: string;
}

const QuickOrder: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number>(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productNotes, setProductNotes] = useState<string>('');
  const [openProductDialog, setOpenProductDialog] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart>({
    table_id: 0,
    items: [],
    customer_count: 1,
    total_amount: 0
  });
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Load tables
      const tablesResponse = await tableService.getTables();
      const formattedTables = tablesResponse.data.map((table: any) => ({
        id: table.id,
        number: parseInt(table.name.replace('Masa ', '')) || table.id,
        capacity: table.capacity,
        status: table.status || 'available',
        active: table.is_active,
        location: table.location || 'İç Alan'
      }));
      setTables(formattedTables);

      // Load categories
      const categoriesResponse = await menuService.getCategories();
      setCategories(categoriesResponse.data);

      // Load products
      const productsResponse = await menuService.getProducts();
      setProducts(productsResponse.data.filter((product: Product) => product.is_active && product.is_available));
      setFilteredProducts(productsResponse.data.filter((product: Product) => product.is_active && product.is_available));
      
      // Load active orders
      const ordersResponse = await orderService.getOrders();
      const activeOrders = ordersResponse.data.filter((order: Order) => 
        order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELED
      );
      setCurrentOrders(activeOrders);
    } catch (error) {
      console.error('Veri yüklenirken hata oluştu:', error);
      setErrorMessage('Veri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setOpenErrorSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter products when category is selected
  useEffect(() => {
    filterProducts();
  }, [selectedCategoryId, searchQuery, products]);

  const filterProducts = () => {
    let filtered = [...products];
    
    // Category filter
    if (selectedCategoryId > 0) {
      filtered = filtered.filter(product => product.category_id === selectedCategoryId);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTableSelect = (tableId: number) => {
    setSelectedTableId(tableId);
    setCart({ ...cart, table_id: tableId });
    
    // Switch to menu tab after selecting a table
    setActiveTab(1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCustomerCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 1;
    if (value > 0) {
      setCart({ ...cart, customer_count: value });
    }
  };

  const handleOrderNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCart({ ...cart, notes: event.target.value });
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductQuantity(1);
    setProductNotes('');
    setOpenProductDialog(true);
  };

  const handleProductNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProductNotes(event.target.value);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    const newItem: OrderItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: productQuantity,
      unit_price: selectedProduct.price,
      total_price: selectedProduct.price * productQuantity,
      notes: productNotes || undefined
    };
    
    // Check if product is already in cart
    const existingItemIndex = cart.items.findIndex(item => item.product_id === newItem.product_id);
    
    let updatedItems;
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = [...cart.items];
      const existingItem = updatedItems[existingItemIndex];
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + newItem.quantity,
        total_price: (existingItem.quantity + newItem.quantity) * existingItem.unit_price,
        notes: newItem.notes || existingItem.notes
      };
    } else {
      // Add new item
      updatedItems = [...cart.items, newItem];
    }
    
    // Calculate total
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    
    // Update cart
    setCart({
      ...cart,
      items: updatedItems,
      total_amount: totalAmount
    });
    
    setOpenProductDialog(false);
  };

  const handleRemoveFromCart = (productId: number) => {
    const updatedItems = cart.items.filter(item => item.product_id !== productId);
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    
    setCart({
      ...cart,
      items: updatedItems,
      total_amount: totalAmount
    });
  };

  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, productQuantity + amount);
    setProductQuantity(newQuantity);
  };

  const handleCreateOrder = async () => {
    if (cart.items.length === 0) {
      setErrorMessage('Sipariş için en az bir ürün eklemelisiniz.');
      setOpenErrorSnackbar(true);
      return;
    }

    if (cart.table_id === 0) {
      setErrorMessage('Lütfen bir masa seçin.');
      setOpenErrorSnackbar(true);
      return;
    }

    setLoading(true);
    try {
      // Prepare order data
      const orderData = {
        table_id: cart.table_id,
        items: cart.items,
        customer_count: cart.customer_count,
        notes: cart.notes || undefined,
        status: 'new'
      };

      // Create order
      const response = await orderService.createOrder(orderData);
      
      // Mark table as occupied
      await tableService.updateTable(cart.table_id, { status: 'occupied' });
      
      // Reset cart
      setCart({
        table_id: 0,
        items: [],
        customer_count: 1,
        total_amount: 0
      });
      
      // Refresh data
      await fetchData();
      
      // Show tables tab
      setActiveTab(0);
      setSelectedTableId(0);
    } catch (error) {
      console.error('Sipariş oluşturulurken hata oluştu:', error);
      setErrorMessage('Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      setOpenErrorSnackbar(true);
    } finally {
      setLoading(false);
    }
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

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return 'Yeni';
      case OrderStatus.PREPARING:
        return 'Hazırlanıyor';
      case OrderStatus.READY:
        return 'Hazır';
      case OrderStatus.DELIVERED:
        return 'Teslim Edildi';
      case OrderStatus.CANCELED:
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return 'primary';
      case OrderStatus.PREPARING:
        return 'secondary';
      case OrderStatus.READY:
        return 'success';
      case OrderStatus.DELIVERED:
        return 'info';
      case OrderStatus.CANCELED:
        return 'error';
      default:
        return 'default';
    }
  };

  const renderTablesGrid = () => {
    return (
      <Grid container spacing={2}>
        {tables.map(table => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={table.id}>
            <Paper
              elevation={3}
              sx={{ 
                p: 2, 
                textAlign: 'center', 
                cursor: 'pointer',
                backgroundColor: table.status === 'occupied' ? '#ffebee' : table.status === 'reserved' ? '#fff8e1' : '#e8f5e9',
                border: selectedTableId === table.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }
              }}
              onClick={() => handleTableSelect(table.id)}
            >
              <Typography variant="h6" fontWeight="bold">
                Masa {table.number}
              </Typography>
              <Chip 
                label={table.status === 'occupied' ? 'Dolu' : table.status === 'reserved' ? 'Rezerve' : 'Boş'} 
                color={table.status === 'occupied' ? 'error' : table.status === 'reserved' ? 'warning' : 'success'} 
                size="small"
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {table.capacity} Kişilik
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {table.location}
              </Typography>
              
              {table.status === 'occupied' && (
                <Box sx={{ mt: 1 }}>
                  {currentOrders.filter(order => order.table_id === table.id).map(order => (
                    <Chip 
                      key={order.id}
                      label={`Sipariş #${order.id}`}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderCategories = () => {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button
          variant={selectedCategoryId === 0 ? 'contained' : 'outlined'}
          onClick={() => handleCategoryChange(0)}
          size="small"
        >
          Tümü
        </Button>
        
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategoryId === category.id ? 'contained' : 'outlined'}
            onClick={() => handleCategoryChange(category.id)}
            size="small"
          >
            {category.name}
          </Button>
        ))}
      </Box>
    );
  };

  const renderProducts = () => {
    return (
      <Grid container spacing={2}>
        {filteredProducts.map(product => (
          <Grid item xs={6} sm={4} md={3} key={product.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => handleProductSelect(product)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" noWrap>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.description}
                </Typography>
                <Typography variant="body1" color="primary" fontWeight="bold">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderCartItems = () => {
    return (
      <List>
        {cart.items.map((item, index) => (
          <React.Fragment key={item.product_id}>
            <ListItem
              secondaryAction={
                <IconButton edge="end" onClick={() => handleRemoveFromCart(item.product_id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">
                      {item.quantity}x {item.product_name}
                    </Typography>
                    <Typography variant="body1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.total_price)}
                    </Typography>
                  </Box>
                }
                secondary={item.notes}
              />
            </ListItem>
            {index < cart.items.length - 1 && <Divider />}
          </React.Fragment>
        ))}
        
        {cart.items.length === 0 && (
          <Box textAlign="center" py={4}>
            <ShoppingCartIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              Sepet boş
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sipariş oluşturmak için ürün ekleyin
            </Typography>
          </Box>
        )}
      </List>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Hızlı Sipariş
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab label="Masalar" />
              <Tab label="Menü" disabled={selectedTableId === 0} />
              <Tab 
                label={
                  <Badge badgeContent={cart.items.length} color="primary">
                    Sepet
                  </Badge>
                } 
                disabled={cart.items.length === 0} 
              />
            </Tabs>
          </Paper>

          {activeTab === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Sipariş için masa seçin
              </Typography>
              {renderTablesGrid()}
            </>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Masa {tables.find(t => t.id === selectedTableId)?.number || ''}
                    </Typography>
                    
                    <TextField
                      size="small"
                      placeholder="Ürün ara..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  
                  {renderCategories()}
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {renderProducts()}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, position: 'sticky', top: 16 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Sipariş Detayları
                    </Typography>
                    <Badge badgeContent={cart.items.reduce((sum, item) => sum + item.quantity, 0)} color="primary">
                      <ShoppingCartIcon />
                    </Badge>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Müşteri Sayısı"
                          type="number"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon fontSize="small" />
                              </InputAdornment>
                            ),
                            inputProps: { min: 1 }
                          }}
                          value={cart.customer_count}
                          onChange={handleCustomerCountChange}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <TextField
                    fullWidth
                    size="small"
                    label="Sipariş Notu"
                    multiline
                    rows={2}
                    value={cart.notes || ''}
                    onChange={handleOrderNotesChange}
                    sx={{ mb: 2 }}
                  />
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Ürünler
                  </Typography>
                  
                  {renderCartItems()}
                  
                  {cart.items.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      <Box display="flex" justifyContent="space-between" mb={3}>
                        <Typography variant="h6">Toplam</Typography>
                        <Typography variant="h6" color="primary">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cart.total_amount)}
                        </Typography>
                      </Box>
                      
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<SaveIcon />}
                        onClick={handleCreateOrder}
                        disabled={cart.items.length === 0}
                      >
                        Siparişi Oluştur
                      </Button>
                    </>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Sepet
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  {renderCartItems()}
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Sipariş Özeti
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body1">Masa:</Typography>
                      <Typography variant="body1">
                        Masa {tables.find(t => t.id === selectedTableId)?.number || ''}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body1">Müşteri Sayısı:</Typography>
                      <Typography variant="body1">{cart.customer_count} kişi</Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body1">Toplam Ürün:</Typography>
                      <Typography variant="body1">{cart.items.reduce((sum, item) => sum + item.quantity, 0)} adet</Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="h6">Toplam Tutar:</Typography>
                      <Typography variant="h6" color="primary">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cart.total_amount)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <TextField
                    fullWidth
                    size="small"
                    label="Sipariş Notu"
                    multiline
                    rows={3}
                    value={cart.notes || ''}
                    onChange={handleOrderNotesChange}
                    sx={{ mb: 3 }}
                  />
                  
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={handleCreateOrder}
                  >
                    Siparişi Oluştur
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}
        </>
      )}

      {/* Product Dialog */}
      <Dialog
        open={openProductDialog}
        onClose={() => setOpenProductDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Ürün Ekle
        </DialogTitle>
        <DialogContent dividers>
          {selectedProduct && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedProduct.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedProduct.description}
              </Typography>
              <Typography variant="body1" color="primary" fontWeight="bold" gutterBottom>
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedProduct.price)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                <Typography variant="body1" sx={{ mr: 2 }}>Adet:</Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={productQuantity <= 1}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography variant="h6" sx={{ mx: 2 }}>
                  {productQuantity}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleQuantityChange(1)}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <TextField
                fullWidth
                label="Ürün Notu"
                multiline
                rows={3}
                value={productNotes}
                onChange={handleProductNotesChange}
                placeholder="Özel istekler (şekersiz, az sütlü vb.)"
                variant="outlined"
                margin="normal"
              />
              
              <Box sx={{ mt: 2, fontWeight: 'bold' }}>
                <Typography align="right" variant="body1" fontWeight="bold">
                  Toplam: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedProduct.price * productQuantity)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>İptal</Button>
          <Button 
            variant="contained" 
            onClick={handleAddToCart}
            disabled={!selectedProduct}
          >
            Sepete Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={openErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenErrorSnackbar(false)} 
          severity="error"
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuickOrder; 