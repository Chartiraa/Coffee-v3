import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  Tab,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import { menuService, tableService, orderService } from '../services/api';

// Ürün tipi
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
  options?: ProductOption[];
}

// Kategori tipi
interface Category {
  id: number;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

// Ürün seçeneği tipi
interface ProductOption {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  is_required: boolean;
  values: ProductOptionValue[];
}

// Ürün seçeneği değeri tipi
interface ProductOptionValue {
  id: number;
  option_id: number;
  value: string;
  price_modifier: number;
  is_default: boolean;
  sort_order: number;
}

// Sipariş öğesi için seçilen seçenek
interface OrderItemOption {
  option_id: number;
  value_id: number;
}

// Sipariş öğesi
interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  options?: OrderItemOption[];
}

// Sepet (sipariş)
interface Cart {
  table_id: number;
  items: OrderItem[];
  notes?: string;
  total_amount: number;
}

// Masa tipi
interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
  active: boolean;
  location?: string;
}

// Masa seçme dialogu
interface TableSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  tables: Table[];
  selectedTableId: number;
  onSelectTable: (tableId: number) => void;
}

// Sipariş tipi
interface Order {
  id: number;
  table_id: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  staff_id?: number;
  staff_name?: string;
}

// Renkli gösterim için masa durumu
const getTableStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return { color: '#084A10', bgColor: 'success.light', text: 'Boş' };
    case 'occupied':
      return { color: '#8B0000', bgColor: 'error.light', text: 'Dolu' };
    case 'reserved':
      return { color: '#654600', bgColor: 'warning.light', text: 'Rezerve' };
    default:
      return { color: '#04304B', bgColor: 'info.light', text: status };
  }
};

const TableSelectionDialog: React.FC<TableSelectionDialogProps> = ({
  open,
  onClose,
  tables,
  selectedTableId,
  onSelectTable
}) => {
  const [locationFilter, setLocationFilter] = useState<string>('Tümü');
  const [showOccupied, setShowOccupied] = useState<boolean>(false);
  const locations = ['Tümü', ...Array.from(new Set(tables.map(table => table.location || 'İç Alan')))];

  // Filtreleme: lokasyon ve doluluk durumuna göre
  const filteredTables = tables.filter(table => 
    (locationFilter === 'Tümü' || table.location === locationFilter) && 
    table.active && 
    (showOccupied || table.status !== 'occupied')
  );
  
  // Masaları gruplandırma: Boş ve Dolu olarak ayrı ayrı göster
  const availableTables = filteredTables.filter(table => table.status !== 'occupied');
  const occupiedTables = filteredTables.filter(table => table.status === 'occupied');

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Masa Seçin</Typography>
          <FormControlLabel
            control={
              <Checkbox 
                checked={showOccupied} 
                onChange={(e) => setShowOccupied(e.target.checked)} 
                color="primary"
              />
            }
            label="Dolu masaları göster"
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: 'calc(80vh - 100px)' }}>
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={locationFilter}
            onChange={(_, newValue) => setLocationFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {locations.map(location => (
              <Tab key={location} label={location} value={location} />
            ))}
          </Tabs>
        </Box>
        
        <Box sx={{ maxHeight: 'calc(70vh - 200px)', overflow: 'auto' }}>
          {availableTables.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                <CheckCircleIcon fontSize="small" color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Kullanılabilir Masalar ({availableTables.length})
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {availableTables.map(table => {
                  const status = getTableStatusColor(table.status);
                  return (
                    <Grid item xs={6} sm={4} md={3} key={table.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          border: selectedTableId === table.id ? '2px solid #1976d2' : 'none',
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 3
                          }
                        }}
                        onClick={() => onSelectTable(table.id)}
                      >
                        <Box sx={{ 
                          bgcolor: status.bgColor, 
                          color: status.color,
                          p: 0.5,
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          <Typography variant="caption" fontWeight="bold">
                            {status.text}
                          </Typography>
                        </Box>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <TableRestaurantIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6">
                            Masa {table.number}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <Chip 
                              icon={<GroupsIcon />} 
                              label={`${table.capacity} Kişilik`} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              icon={<AccessTimeIcon />} 
                              label={table.location} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                        </CardContent>
                        {selectedTableId === table.id && (
                          <Box sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white',
                            p: 0.5,
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5
                          }}>
                            <DoneIcon fontSize="small" />
                            <Typography variant="caption" fontWeight="bold">
                              Seçildi
                            </Typography>
                          </Box>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}
        </Box>
        
        {showOccupied && occupiedTables.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              <WarningIcon fontSize="small" color="error" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Dolu Masalar ({occupiedTables.length})
            </Typography>
            
            <Grid container spacing={2}>
              {occupiedTables.map(table => {
                const status = getTableStatusColor(table.status);
                return (
                  <Grid item xs={6} sm={4} md={3} key={table.id}>
                    <Card sx={{ 
                      cursor: 'pointer',
                      opacity: 0.7,
                      borderRadius: 2
                    }}>
                      <Box sx={{ 
                        bgcolor: status.bgColor, 
                        color: status.color,
                        p: 0.5,
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" fontWeight="bold">
                          {status.text}
                        </Typography>
                      </Box>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <TableRestaurantIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" color="text.secondary">
                          Masa {table.number}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Chip 
                            icon={<GroupsIcon />} 
                            label={`${table.capacity} Kişilik`} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                          <Chip 
                            icon={<AccessTimeIcon />} 
                            label={table.location} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
        
        {filteredTables.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {locationFilter !== 'Tümü' 
                ? `${locationFilter} konumunda uygun masa bulunamadı.`
                : 'Uygun masa bulunamadı.'
              }
            </Typography>
            {!showOccupied && (
              <Button 
                startIcon={<WarningIcon />}
                color="warning"
                onClick={() => setShowOccupied(true)}
                sx={{ mt: 2 }}
              >
                Dolu masaları göster
              </Button>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button 
          variant="contained" 
          onClick={onClose}
          disabled={selectedTableId === 0}
          startIcon={<DoneIcon />}
        >
          Seç
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Ürün Ekleme Dialog - Doğrudan sipariş oluşturma 
const ProductAddDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (quantity: number, notes: string, options: OrderItemOption[]) => void;
  table: Table | null;
  customerCount: number;
  onCustomerCountChange: (count: number) => void;
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
  cart: Cart;
  onRemoveCartItem: (productId: number) => void;
  onCreateOrder: () => void;
  loading: boolean;
}> = ({ 
  open, 
  onClose, 
  product, 
  onAddToCart, 
  table,
  customerCount,
  onCustomerCountChange,
  orderNotes,
  onOrderNotesChange,
  cart,
  onRemoveCartItem,
  onCreateOrder,
  loading
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<OrderItemOption[]>([]);
  const [activeTab, setActiveTab] = useState<string>(product ? 'product' : 'cart');

  useEffect(() => {
    if (product) {
      setActiveTab('product');
      setQuantity(1);
      setNotes('');
      
      // Varsayılan seçenekleri ayarla
      if (product.options && product.options.length > 0) {
        const defaultOptions: OrderItemOption[] = [];
        
        product.options.forEach((option: ProductOption) => {
          const defaultValue = option.values.find((value: ProductOptionValue) => value.is_default);
          if (defaultValue) {
            defaultOptions.push({
              option_id: option.id,
              value_id: defaultValue.id
            });
          }
        });
        
        setSelectedOptions(defaultOptions);
      } else {
        setSelectedOptions([]);
      }
    } else {
      setActiveTab('cart');
    }
  }, [product]);

  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, quantity + amount);
    setQuantity(newQuantity);
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(event.target.value);
  };

  const handleCustomerCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 1;
    if (value > 0) {
      onCustomerCountChange(value);
    }
  };

  const handleOptionChange = (optionId: number, valueId: number) => {
    const updatedOptions = [...selectedOptions];
    const existingIndex = updatedOptions.findIndex(opt => opt.option_id === optionId);
    
    if (existingIndex >= 0) {
      updatedOptions[existingIndex].value_id = valueId;
    } else {
      updatedOptions.push({ option_id: optionId, value_id: valueId });
    }
    
    setSelectedOptions(updatedOptions);
  };

  // Toplam fiyat hesaplama (ürün ve seçenek modifierleri dahil)
  const calculateTotalPrice = (): number => {
    if (!product) return 0;
    
    let total = Number(product.price) || 0;
    
    // Seçenek fiyat modifierlarını ekle
    if (product.options && selectedOptions && selectedOptions.length > 0) {
      product.options.forEach(option => {
        const selectedOption = selectedOptions.find(opt => opt.option_id === option.id);
        if (selectedOption) {
          const selectedValue = option.values.find(val => val.id === selectedOption.value_id);
          if (selectedValue && selectedValue.price_modifier !== undefined) {
            total += Number(selectedValue.price_modifier) || 0;
          }
        }
      });
    }
    
    return total * (Number(quantity) || 1);
  };

  // Ürün seçeneklerini render et
  const renderProductOptions = () => {
    if (!product || !product.options || product.options.length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Seçenekler
        </Typography>
        
        {product.options.map(option => (
          <Box key={option.id} sx={{ mb: 3 }}>
            <FormControl component="fieldset" required={option.is_required} fullWidth>
              <FormLabel component="legend" sx={{ mb: 1 }}>
                {option.name} 
                {option.is_required && <span style={{ color: 'red' }}>*</span>}
              </FormLabel>
              
              <RadioGroup
                value={selectedOptions.find(opt => opt.option_id === option.id)?.value_id || ''}
                onChange={(e) => handleOptionChange(option.id, Number(e.target.value))}
              >
                {option.values.map(value => (
                  <FormControlLabel 
                    key={value.id} 
                    value={value.id} 
                    control={<Radio />} 
                    label={
                      <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{value.value}</span>
                        {value.price_modifier > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            +{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value.price_modifier)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        ))}
      </Box>
    );
  };

  // Sepet içeriğini göster
  const renderCartItems = () => {
    return (
      <List sx={{ width: '100%', p: 0 }}>
        {cart.items.map((item, index) => (
          <React.Fragment key={item.product_id}>
            <ListItem
              secondaryAction={
                <IconButton edge="end" onClick={() => onRemoveCartItem(item.product_id)}>
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

  const handleAdd = () => {
    onAddToCart(quantity, notes, selectedOptions);
    setActiveTab('cart');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column' 
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {table ? `Masa ${table.number} - Sipariş` : 'Ürün Ekle'}
          </Typography>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
          >
            {product && <Tab value="product" label="Ürün Detayı" />}
            <Tab value="cart" label={`Sepet (${cart.items.length})`} />
          </Tabs>
        </Box>
      </DialogTitle>
      <DialogContent 
        dividers 
        sx={{ 
          p: 0, 
          flexGrow: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column' 
        }}
      >
        {activeTab === 'product' && product && (
          <Box sx={{ p: 2, overflow: 'auto', flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {product.description}
            </Typography>
            <Typography variant="body1" color="primary" fontWeight="bold" gutterBottom>
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>Adet:</Typography>
              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h6" sx={{ mx: 2 }}>
                {quantity}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(1)}
              >
                <AddIcon />
              </IconButton>
            </Box>
            
            {renderProductOptions()}
            
            <TextField
              fullWidth
              label="Ürün Notu"
              multiline
              rows={2}
              value={notes}
              onChange={handleNotesChange}
              placeholder="Özel istekler (şekersiz, az sütlü vb.)"
              variant="outlined"
              margin="normal"
            />
            
            <Box sx={{ mt: 2, fontWeight: 'bold' }}>
              <Typography align="right" variant="body1" fontWeight="bold">
                Toplam: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(calculateTotalPrice())}
              </Typography>
            </Box>
          </Box>
        )}

        {activeTab === 'cart' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
              {renderCartItems()}
            </Box>
            
            {cart.items.length > 0 && (
              <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" color="primary" align="right">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cart.total_amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Sipariş Notu"
                      multiline
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => onOrderNotesChange(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Button onClick={onClose}>İptal</Button>
        {activeTab === 'product' && product ? (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleAdd}
          >
            Sepete Ekle
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary"
            onClick={onCreateOrder}
            disabled={cart.items.length === 0 || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Siparişi Oluştur
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTableId = Number(queryParams.get('table')) || 0;
  
  // Varsayılan olarak varsayalım ki kullanıcı yetkileri var
  // Gerçek kullanıcı rolünü almak için localStorage, sessionStorage veya API kullanabilirsiniz
  const [userRole, setUserRole] = useState<string>('admin'); // varsayılan rol
  const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
  const [currentStaffName, setCurrentStaffName] = useState<string>('');

  // Mevcut personeli yükleme
  useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan alıyoruz
    // Gerçek uygulamada burada daha güvenli bir yöntem kullanılmalıdır
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUserRole(userObj.role || 'waiter');
        setCurrentStaffId(userObj.id || null);
        setCurrentStaffName(userObj.name || '');
      } catch (error) {
        console.error('Kullanıcı bilgileri çözümlenemedi:', error);
      }
    }
  }, []);

  // State tanımları
  const [loading, setLoading] = useState<boolean>(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number>(initialTableId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productNotes, setProductNotes] = useState<string>('');
  const [openProductDialog, setOpenProductDialog] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart>({
    table_id: initialTableId,
    items: [],
    total_amount: 0
  });
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [openTableDialog, setOpenTableDialog] = useState<boolean>(false);
  const [selectedOptions, setSelectedOptions] = useState<OrderItemOption[]>([]);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [tableView, setTableView] = useState<boolean>(selectedTableId === 0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // URL parametreleri işleme
  useEffect(() => {
    // URL'den parametreleri al
    const params = new URLSearchParams(window.location.search);
    const tableId = params.get('table');
    const orderId = params.get('order');
    
    // Masa ID'si varsa seç
    if (tableId) {
      const numericTableId = parseInt(tableId, 10);
      setSelectedTableId(numericTableId);
      setCart({ ...cart, table_id: numericTableId });
      setTableView(false);
      
      // Sipariş ID'si de varsa, sipariş düzenleme modunu aç
      if (orderId) {
        const numericOrderId = parseInt(orderId, 10);
        // API'den sipariş bilgilerini al ve düzenleme modunu aç
        fetchOrderForEdit(numericOrderId);
      }
    }
    
    // URL parametrelerini temizle (sadece refresh durumunda yeniden çalışması için)
    if (orderId) {
      navigate(`/new-order?table=${tableId}`, { replace: true });
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Düzenleme için sipariş alma
  const fetchOrderForEdit = async (orderId: number) => {
    try {
      // Sipariş detaylarını getir
      const response = await orderService.getOrderById(orderId);
      const order = response.data;
      
      // Düzenlenen siparişi state'e ata
      setEditingOrder(order);
      
      // Siparişteki ilk ürünü al
      if (order.items && order.items.length > 0) {
        const item = order.items[0];
        
        // Ürün detaylarını getir
        const productResponse = await menuService.getProductById(item.product_id);
        const product = productResponse.data;
        
        // Ürün bilgilerini seçili ürün olarak ata
        setSelectedProduct(product);
        
        // Miktar bilgisini güncelle
        setProductQuantity(item.quantity);
        
        // Notları güncelle
        setProductNotes(item.notes || '');
        
        // Seçenekleri güncelle
        if (item.options && item.options.length > 0) {
          setSelectedOptions(item.options);
        } else {
          setSelectedOptions([]);
        }
        
        // Dialog'u aç
        setOpenProductDialog(true);
      }
    } catch (error) {
      console.error('Sipariş düzenleme için veriler yüklenirken hata oluştu:', error);
      setErrorMessage('Sipariş düzenleme için veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      setOpenErrorSnackbar(true);
    }
  };

  // Scrollbar stilini ayarla
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      html, body {
        height: 100%;
        margin: 0;
        overflow: hidden;
      }
      .content-container {
        height: 100vh;
        max-height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .scrollable {
        overflow-y: auto;
        scrollbar-width: thin;
      }
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(25, 118, 210, 0.1);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(25, 118, 210, 0.7);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(25, 118, 210, 0.9);
      }
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(25, 118, 210, 0.7) rgba(25, 118, 210, 0.1);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Veri yükleme
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Masaları yükle - sadece aktif masalar
        const tablesResponse = await tableService.getTables(true);
        const formattedTables = tablesResponse.data.map((table: any) => ({
          id: table.id,
          number: parseInt(table.name.replace('Masa ', '')) || table.id,
          capacity: table.capacity,
          status: table.status || 'available', // API'den gelen status değerini kullan
          active: table.is_active,
          location: table.location || 'İç Alan'
        }));
        setTables(formattedTables);

        // Kategorileri yükle - sadece aktif kategoriler
        const categoriesResponse = await menuService.getActiveCategories();
        setCategories(categoriesResponse.data);

        // Ürünleri yükle - sadece aktif ve mevcut ürünler
        try {
          const productsResponse = await menuService.getActiveProducts();
          setProducts(productsResponse.data);
          setFilteredProducts(productsResponse.data);
        } catch (error) {
          console.error('Aktif ürünler yüklenirken hata oluştu:', error);
          setErrorMessage('Ürünler yüklenirken bir hata oluştu.');
          setOpenErrorSnackbar(true);
        }
      } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error);
        setErrorMessage('Veri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
        setOpenErrorSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Masa değiştiğinde masanın siparişlerini yükle
  useEffect(() => {
    if (selectedTableId > 0) {
      loadTableOrders();
    } else {
      setTableOrders([]);
    }
  }, [selectedTableId]);

  // Masa siparişlerini yükleme
  const loadTableOrders = async () => {
    if (selectedTableId === 0) return;
    
    setLoadingOrders(true);
    try {
      // Masaya ait SADECE aktif siparişleri getir (completed ve cancelled olmayanlar)
      // excludeCompleted=true parametresi ile API'den tamamlanmış siparişleri hariç tutuyoruz
      const response = await orderService.getTableOrders(selectedTableId, undefined, true);
      
      // Backend'den gelen veriyi direk kullanabiliriz, zaten tamamlanmış siparişler filtrelenmiş olacak
      // Siparişlere ait detayları al
      const ordersWithDetails = await Promise.all(
        response.data.map(async (order: Order) => {
          try {
            const detailsResponse = await orderService.getOrderById(order.id);
            return detailsResponse.data;
          } catch (error) {
            console.error(`Sipariş detayları alınamadı (ID: ${order.id}):`, error);
            return order;
          }
        })
      );
      
      // Sadece aktif siparişleri tabloya işle
      setTableOrders(ordersWithDetails);
    } catch (error) {
      console.error('Masa siparişleri yüklenirken hata oluştu:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Kategori seçildiğinde ürünleri filtrele
  useEffect(() => {
    filterProducts();
  }, [selectedCategoryId, searchQuery, products]);

  // Ürünleri filtrele
  const filterProducts = () => {
    let filtered = [...products];
    
    // Kategori filtresi
    if (selectedCategoryId > 0) {
      filtered = filtered.filter(product => product.category_id === selectedCategoryId);
    }
    
    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  };

  // Kategori değişimi
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  // Arama değişimi
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Masa değişimi
  const handleTableChange = (event: SelectChangeEvent<number>) => {
    setSelectedTableId(Number(event.target.value));
    setCart({ ...cart, table_id: Number(event.target.value) });
  };

  // Ürün detaylarını yükleme
  const loadProductDetails = async (productId: number) => {
    try {
      const response = await menuService.getProductById(productId);
      const productWithOptions = response.data;
      setSelectedProduct(productWithOptions);
      
      // Varsayılan seçenekleri ayarla
      if (productWithOptions.options && productWithOptions.options.length > 0) {
        const defaultOptions: OrderItemOption[] = [];
        
        productWithOptions.options.forEach((option: ProductOption) => {
          const defaultValue = option.values.find((value: ProductOptionValue) => value.is_default);
          if (defaultValue) {
            defaultOptions.push({
              option_id: option.id,
              value_id: defaultValue.id
            });
          }
        });
        
        setSelectedOptions(defaultOptions);
      } else {
        setSelectedOptions([]);
      }
      
      setOpenProductDialog(true);
    } catch (error) {
      console.error('Ürün detayları yüklenirken hata oluştu:', error);
    }
  };

  // Ürün seçimi
  const handleProductSelect = (product: Product) => {
    setEditingOrder(null); // Düzenleme modunu sıfırla
    loadProductDetails(product.id);
  };

  // Ürün miktarını değiştirme
  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, productQuantity + amount);
    setProductQuantity(newQuantity);
  };

  // Ürün notları değişimi
  const handleProductNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProductNotes(event.target.value);
  };

  // Sipariş notu değişimi
  const handleOrderNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCart({ ...cart, notes: event.target.value });
  };

  // Seçenek değişikliği
  const handleOptionChange = (optionId: number, valueId: number) => {
    const updatedOptions = [...selectedOptions];
    const existingIndex = updatedOptions.findIndex(opt => opt.option_id === optionId);
    
    if (existingIndex >= 0) {
      updatedOptions[existingIndex].value_id = valueId;
    } else {
      updatedOptions.push({ option_id: optionId, value_id: valueId });
    }
    
    setSelectedOptions(updatedOptions);
  };

  // Toplam fiyat hesaplama (ürün ve seçenek modifierleri dahil)
  const calculateTotalPrice = (): number => {
    if (!selectedProduct) return 0;
    
    let total = Number(selectedProduct.price) || 0;
    
    // Seçenek fiyat modifierlarını ekle
    if (selectedProduct.options && selectedOptions && selectedOptions.length > 0) {
      selectedProduct.options.forEach(option => {
        const selectedOption = selectedOptions.find(opt => opt.option_id === option.id);
        if (selectedOption) {
          const selectedValue = option.values.find(val => val.id === selectedOption.value_id);
          if (selectedValue && selectedValue.price_modifier !== undefined) {
            total += Number(selectedValue.price_modifier) || 0;
          }
        }
      });
    }
    
    return total * (Number(productQuantity) || 1);
  };

  // Kullanıcı rolü kontrolü
  const hasEditPermission = (orderStatus: string) => {
    // Eğer sipariş ready durumundaysa, sadece manager ve admin düzenleyebilir
    if (orderStatus === 'ready') {
      return userRole === 'manager' || userRole === 'admin';
    }
    
    // Diğer durumlarda waiter, manager ve admin düzenleyebilir
    return userRole === 'waiter' || userRole === 'manager' || userRole === 'admin';
  };
  
  // Kullanıcı silme izni kontrolü
  const hasDeletePermission = (orderStatus: string) => {
    // Eğer sipariş ready durumundaysa, sadece manager ve admin silebilir
    if (orderStatus === 'ready') {
      return userRole === 'manager' || userRole === 'admin';
    }
    
    // Diğer durumlarda waiter, manager ve admin silebilir
    return userRole === 'waiter' || userRole === 'manager' || userRole === 'admin';
  };

  // Sipariş oluştur
  const handleCreateOrderFromProduct = async () => {
    if (!selectedProduct) return;

    try {
      // API'nin beklediği formatta sipariş verisi hazırlama
      const orderData = {
        table_id: selectedTableId,
        items: [{
          product_id: selectedProduct.id,
          quantity: productQuantity,
          notes: productNotes || undefined,
          options: selectedOptions.length > 0 ? [...selectedOptions] : undefined
        }],
        notes: undefined,
        staff_id: currentStaffId // Personel bilgisini ekle
      };

      // Siparişi oluştur
      await orderService.createOrder(orderData);
      
      setOpenProductDialog(false);
      
      // Masanın siparişlerini yeniden yükle
      await loadTableOrders();
      
      // Masa verilerini yeniden yükle - Tüm verileri yeniden çekme işlemi
      const tablesResponse = await tableService.getTables(true);
      const formattedTables = tablesResponse.data.map((table: any) => ({
        id: table.id,
        number: parseInt(table.name.replace('Masa ', '')) || table.id,
        capacity: table.capacity,
        status: table.status || 'available', // API'den gelen status değerini kullan
        active: table.is_active,
        location: table.location || 'İç Alan'
      }));
      setTables(formattedTables);
      
      // Başarılı mesajı göster
      setErrorMessage("Sipariş başarıyla oluşturuldu!");
      setOpenErrorSnackbar(true);
    } catch (error) {
      console.error('Sipariş oluşturulurken hata oluştu:', error);
      setErrorMessage('Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      setOpenErrorSnackbar(true);
    }
  };

  // Sipariş düzenleme işlemi
  const handleEditOrder = async (orderId: number) => {
    try {
      // Sipariş detaylarını getir
      const response = await orderService.getOrderById(orderId);
      const order = response.data;
      
      // Düzenlenen siparişi state'e ata
      setEditingOrder(order);
      
      // Siparişteki ilk ürünü al
      if (order.items && order.items.length > 0) {
        const item = order.items[0];
        
        // Ürün detaylarını getir
        const productResponse = await menuService.getProductById(item.product_id);
        const product = productResponse.data;
        
        // Ürün bilgilerini seçili ürün olarak ata
        setSelectedProduct(product);
        
        // Miktar bilgisini güncelle
        setProductQuantity(item.quantity);
        
        // Notları güncelle
        setProductNotes(item.notes || '');
        
        // Seçenekleri güncelle
        if (item.options && item.options.length > 0) {
          setSelectedOptions(item.options);
        } else {
          setSelectedOptions([]);
        }
        
        // Dialog'u aç
        setOpenProductDialog(true);
      }
    } catch (error) {
      console.error('Sipariş düzenleme için veriler yüklenirken hata oluştu:', error);
      setErrorMessage('Sipariş düzenleme için veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      setOpenErrorSnackbar(true);
    }
  };
  
  // Sipariş güncelleme fonksiyonu
  const handleUpdateOrder = async () => {
    if (!selectedProduct || !editingOrder) return;
    
    try {
      // API'nin beklediği formatta sipariş verisi hazırlama
      const orderData = {
        table_id: selectedTableId,
        items: [{
          product_id: selectedProduct.id,
          quantity: productQuantity,
          notes: productNotes || undefined,
          options: selectedOptions.length > 0 ? [...selectedOptions] : undefined
        }],
        notes: undefined
      };

      // Siparişi güncelle
      await orderService.updateOrder(editingOrder.id, orderData);
      
      // Dialog'u kapat
      setOpenProductDialog(false);
      setEditingOrder(null);
      
      // Masanın siparişlerini yeniden yükle
      await loadTableOrders();
      
      // Masa verilerini yeniden yükle - Tüm verileri yeniden çekme işlemi
      const tablesResponse = await tableService.getTables(true);
      const formattedTables = tablesResponse.data.map((table: any) => ({
        id: table.id,
        number: parseInt(table.name.replace('Masa ', '')) || table.id,
        capacity: table.capacity,
        status: table.status || 'available', // API'den gelen status değerini kullan
        active: table.is_active,
        location: table.location || 'İç Alan'
      }));
      setTables(formattedTables);
      
      // Başarılı mesajı göster
      setErrorMessage("Sipariş başarıyla güncellendi!");
      setOpenErrorSnackbar(true);
      
    } catch (error) {
      console.error('Sipariş güncellenirken hata oluştu:', error);
      setErrorMessage('Sipariş güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      setOpenErrorSnackbar(true);
    }
  };

  // Sipariş silme işlemi
  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm('Bu siparişi silmek istediğinize emin misiniz?')) {
      try {
        // Siparişi sil API çağrısı - backend API'si düzeltilmeli
        await orderService.updateOrderStatus(orderId, 'cancelled');
        
        // Masanın siparişlerini yeniden yükle
        await loadTableOrders();
        
        // Başarılı mesajı göster
        setErrorMessage("Sipariş başarıyla silindi!");
        setOpenErrorSnackbar(true);
      } catch (error) {
        console.error('Sipariş silinirken hata oluştu:', error);
        setErrorMessage('Sipariş silinirken bir hata oluştu. Lütfen tekrar deneyin.');
        setOpenErrorSnackbar(true);
      }
    }
  };

  // Masa seçme
  const handleSelectTable = (tableId: number) => {
    setSelectedTableId(tableId);
    setCart({ ...cart, table_id: tableId });
    setTableView(false); // Masa görünümünden sipariş görünümüne geç
  };

  // Masa görünümüne geri dön
  const handleBackToTables = () => {
    setTableView(true);
  };

  // Masaları görüntüleme
  const renderTableButtons = () => {
    // Masaları konumlara göre gruplanmış şekilde göster
    const locationGroups = Array.from(new Set(tables.map(table => table.location || 'İç Alan')));
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Sipariş Eklenecek Masayı Seçin
        </Typography>
        
        {locationGroups.map(location => (
          <Box key={location} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ 
              mb: 1, 
              bgcolor: 'primary.main', 
              color: 'white', 
              p: 1, 
              borderRadius: 1 
            }}>
              {location}
            </Typography>
            
            <Grid container spacing={2}>
              {tables
                .filter(table => (table.location || 'İç Alan') === location)
                .sort((a, b) => a.number - b.number)
                .map(table => {
                  const status = getTableStatusColor(table.status);
                  const isOccupied = table.status === 'occupied';
                  
                  return (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={table.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: `2px solid ${status.color}`,
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 3
                          },
                          position: 'relative',
                          overflow: 'visible'
                        }}
                        onClick={() => handleSelectTable(table.id)}
                      >
                        {isOccupied && (
                          <Box sx={{
                            position: 'absolute',
                            top: -10,
                            right: -10,
                            bgcolor: 'error.main',
                            color: 'white',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1
                          }}>
                            <WarningIcon fontSize="small" />
                          </Box>
                        )}
                        <Box sx={{ 
                          bgcolor: status.bgColor, 
                          color: status.color,
                          p: 0.5,
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          <Typography variant="caption" fontWeight="bold">
                            {status.text}
                          </Typography>
                        </Box>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h5" fontWeight="bold">
                            Masa {table.number}
                          </Typography>
                          <Chip 
                            icon={<GroupsIcon />} 
                            label={`${table.capacity} Kişilik`} 
                            size="small" 
                            variant="outlined"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          </Box>
        ))}
      </Box>
    );
  };

  // Sipariş içerik özetini göster
  const renderOrderItemsSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return null;
    
    // En fazla 3 ürün göster, sonrasında +x şeklinde özet
    const displayItems = items.slice(0, 3);
    const remainingCount = items.length - displayItems.length;
    
    return (
      <Box sx={{ mt: 1 }}>
        {displayItems.map((item, idx) => (
          <Typography key={idx} variant="caption" display="block" sx={{ color: 'text.secondary' }}>
            {item.quantity}x {item.product_name}
          </Typography>
        ))}
        
        {remainingCount > 0 && (
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            +{remainingCount} diğer ürün
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box className="content-container">
      <Typography variant="h4" gutterBottom>
        {tableView ? 'Masa Seçimi' : 'Sipariş Oluştur'}
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      )}

      {!loading && tableView && (
        // Masa seçim ekranı
        <Paper sx={{ p: 3, flexGrow: 1 }} className="scrollable">
          {renderTableButtons()}
        </Paper>
      )}

      {!loading && !tableView && (
        // Sipariş ekranı
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Seçili masa bilgisi ve geri butonu */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToTables}
            >
              Masa Seçimine Dön
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TableRestaurantIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="primary">
                Masa {tables.find(t => t.id === selectedTableId)?.number || ''}
              </Typography>
              <Chip 
                label={tables.find(t => t.id === selectedTableId)?.capacity + ' Kişilik'} 
                size="small" 
                sx={{ ml: 1 }}
                icon={<GroupsIcon />}
              />
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {/* Sol Taraf - Mevcut Siparişler */}
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1">
                      <ReceiptIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Mevcut Siparişler
                    </Typography>
                    {loadingOrders && <CircularProgress size={20} />}
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ flexGrow: 1, height: 'calc(100% - 50px)' }} className="scrollable">
                    {tableOrders.length === 0 ? (
                      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                        <Typography color="text.secondary">Bu masaya ait aktif sipariş bulunmuyor.</Typography>
                      </Box>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {tableOrders.map((order) => (
                          <React.Fragment key={order.id}>
                            <ListItem
                              sx={{ 
                                borderLeft: 4, 
                                borderLeftColor: 
                                  order.status === 'created' 
                                    ? 'warning.main' 
                                    : order.status === 'in_progress' 
                                      ? 'info.main' 
                                      : order.status === 'ready' 
                                        ? 'success.main' 
                                        : 'primary.main',
                                bgcolor: 'background.paper',
                              }}
                              secondaryAction={
                                <Box>
                                  {hasEditPermission(order.status) && (
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEditOrder(order.id)}
                                      sx={{ mr: 1 }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                  {hasDeletePermission(order.status) && (
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteOrder(order.id)}
                                    >
                                      <DeleteForeverIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body1" fontWeight="bold">
                                      #{order.id}
                                    </Typography>
                                    <Chip 
                                      size="small" 
                                      label={
                                        order.status === 'created' ? 'Yeni' :
                                        order.status === 'in_progress' ? 'Hazırlanıyor' :
                                        order.status === 'ready' ? 'Hazır' :
                                        order.status
                                      }
                                      color={
                                        order.status === 'created' ? 'warning' :
                                        order.status === 'in_progress' ? 'info' :
                                        order.status === 'ready' ? 'success' :
                                        'default'
                                      }
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box component="div">
                                    <Typography variant="caption" display="block">
                                      {new Date(order.created_at).toLocaleString('tr-TR')}
                                    </Typography>
                                    {order.staff_name && (
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        Personel: {order.staff_name}
                                      </Typography>
                                    )}
                                    <Typography variant="body2" fontWeight="bold" color="primary" display="block">
                                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total_amount)}
                                    </Typography>
                                    {renderOrderItemsSummary(order.items)}
                                  </Box>
                                }
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              {/* Orta Sütun - Kategoriler */}
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Kategoriler
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ flexGrow: 1, height: 'calc(100% - 50px)' }} className="scrollable">
                    <Button
                      variant={selectedCategoryId === 0 ? 'contained' : 'outlined'}
                      onClick={() => handleCategoryChange(0)}
                      size="medium"
                      fullWidth
                      sx={{ mb: 1, py: 1.5 }}
                    >
                      Tümü
                    </Button>
                    
                    {categories.map(category => (
                      <Button
                        key={category.id}
                        variant={selectedCategoryId === category.id ? 'contained' : 'outlined'}
                        onClick={() => handleCategoryChange(category.id)}
                        size="medium"
                        fullWidth
                        sx={{ mb: 1, py: 1.5, textAlign: 'center', justifyContent: 'center' }}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </Box>
                </Paper>
              </Grid>
              
              {/* Sağ Sütun - Ürünler */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Ürünler
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
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ flexGrow: 1, height: 'calc(100% - 70px)' }} className="scrollable">
                    <Grid container spacing={2}>
                      {filteredProducts.map(product => (
                        <Grid item xs={6} sm={4} md={4} key={product.id}>
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
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* Ürün Sipariş Dialog */}
      <Dialog
        open={openProductDialog}
        onClose={() => {
          setOpenProductDialog(false);
          setEditingOrder(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: 'auto', maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {selectedProduct && (
              <Typography variant="h6">
                {editingOrder ? 'Sipariş #' + editingOrder.id + ' Düzenleniyor' : selectedProduct.name}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent 
          dividers 
          sx={{ 
            p: 0, 
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 160px)'
          }}
        >
          {selectedProduct && (
            <Box sx={{ p: 3 }}>
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
              
              {/* Ürün seçenekleri */}
              {selectedProduct.options && selectedProduct.options.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Seçenekler
                  </Typography>
                  
                  {selectedProduct.options.map(option => (
                    <Box key={option.id} sx={{ mb: 3 }}>
                      <FormControl component="fieldset" required={option.is_required} fullWidth>
                        <FormLabel component="legend" sx={{ mb: 1 }}>
                          {option.name} 
                          {option.is_required && <span style={{ color: 'red' }}>*</span>}
                        </FormLabel>
                        
                        <RadioGroup
                          value={selectedOptions.find(opt => opt.option_id === option.id)?.value_id || ''}
                          onChange={(e) => handleOptionChange(option.id, Number(e.target.value))}
                        >
                          {option.values.map(value => (
                            <FormControlLabel 
                              key={value.id} 
                              value={value.id} 
                              control={<Radio />} 
                              label={
                                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <span>{value.value}</span>
                                  {value.price_modifier > 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                      +{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value.price_modifier)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </Box>
                  ))}
                </Box>
              )}
              
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
                  Toplam: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(calculateTotalPrice())}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenProductDialog(false);
            setEditingOrder(null);
          }}>
            İptal
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={editingOrder ? handleUpdateOrder : handleCreateOrderFromProduct}
            disabled={editingOrder ? false : loading}
            startIcon={editingOrder ? null : (loading ? <CircularProgress size={20} /> : <SaveIcon />)}
          >
            {editingOrder ? 'Sipariş Güncelle' : 'Sipariş Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hata Snackbar */}
      <Snackbar
        open={openErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenErrorSnackbar(false)} 
          severity={errorMessage.includes("başarıyla") ? "success" : "error"}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewOrder; 