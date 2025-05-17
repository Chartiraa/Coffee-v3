import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
  Alert,
  Tooltip,
  Tab,
  Tabs,
  CircularProgress,
  Snackbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import { inventoryService } from '../services/api';

// Stok ürünü
interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  cost_price: number;
  last_update: string;
  notes?: string;
}

// Kategoriler
const categories = [
  'Tümü',
  'Kahve Çekirdekleri',
  'Süt Ürünleri',
  'Şeker & Tatlandırıcılar',
  'Şuruplar & Soslar',
  'Ambalaj & Servis',
  'Ekipman'
];

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tümü');
  const [tabValue, setTabValue] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [openStockUpdateDialog, setOpenStockUpdateDialog] = useState<boolean>(false);
  const [stockUpdateAmount, setStockUpdateAmount] = useState<string>('');
  const [stockUpdateType, setStockUpdateType] = useState<'add' | 'remove'>('add');
  const [stockUpdateNotes, setStockUpdateNotes] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form state'i
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    min_quantity: '',
    cost_price: '',
    notes: ''
  });

  // API'den veri çekme
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await inventoryService.getInventoryItems();
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (error: any) {
      console.error('Stok verilerini çekerken hata oluştu:', error);
      setError(error.response?.data?.message || 'Stok verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme
  useEffect(() => {
    filterItems();
  }, [items, searchQuery, categoryFilter, tabValue]);

  const filterItems = () => {
    let filtered = [...items];
    
    // Tab filtreleme
    if (tabValue === 1) {
      filtered = filtered.filter(item => {
        const stockInfo = getStockLevelInfo(item);
        return stockInfo.isLow;
      });
    }
    
    // Kategori filtreleme
    if (categoryFilter !== 'Tümü') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Arama filtreleme
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredItems(filtered);
    setPage(0);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value as string);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddItem = () => {
    setCurrentItem(null);
    setOpenDialog(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setCurrentItem(item);
    setOpenDialog(true);
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await inventoryService.deleteInventoryItem(itemId);
      await fetchInventory();
      showSnackbar('Stok başarıyla silindi', 'success');
    } catch (error) {
      console.error('Stok silme hatası:', error);
      showSnackbar('Stok silinirken bir hata oluştu', 'error');
    }
  };

  const handleOpenStockUpdate = (item: InventoryItem) => {
    setCurrentItem(item);
    setStockUpdateAmount('');
    setStockUpdateType('add');
    setStockUpdateNotes('');
    setOpenStockUpdateDialog(true);
  };

  const handleStockUpdate = async () => {
    if (currentItem && stockUpdateAmount) {
      try {
        const amount = parseFloat(stockUpdateAmount);
        if (!isNaN(amount)) {
          const transactionAmount = stockUpdateType === 'add' ? amount : -amount;
          
          if (currentItem.quantity + transactionAmount < 0) {
            showSnackbar('Stok miktarı 0\'ın altına düşemez', 'error');
            return;
          }

          await inventoryService.updateStockQuantity(
            currentItem.id, 
            transactionAmount,
            stockUpdateType === 'add' ? 'purchase' : 'usage',
            stockUpdateNotes,
            stockUpdateType === 'add' ? currentItem.cost_price : undefined
          );
          
          await fetchInventory();
          showSnackbar('Stok miktarı başarıyla güncellendi', 'success');
          setOpenStockUpdateDialog(false);
          setStockUpdateAmount('');
          setStockUpdateNotes('');
        }
      } catch (error) {
        console.error('Stok güncelleme hatası:', error);
        showSnackbar('Stok güncellenirken bir hata oluştu', 'error');
      }
    }
  };

  // Form değişiklik handler'ı
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Dialog açılırken form verilerini set et
  useEffect(() => {
    if (openDialog) {
      if (currentItem) {
        setFormData({
          name: currentItem.name,
          category: currentItem.category,
          quantity: currentItem.quantity.toString(),
          unit: currentItem.unit,
          min_quantity: currentItem.min_quantity.toString(),
          cost_price: currentItem.cost_price.toString(),
          notes: currentItem.notes || ''
        });
      } else {
        setFormData({
          name: '',
          category: '',
          quantity: '',
          unit: '',
          min_quantity: '',
          cost_price: '',
          notes: ''
        });
      }
    }
  }, [openDialog, currentItem]);

  const handleSaveItem = async () => {
    try {
      // Zorunlu alanları kontrol et
      if (!formData.name || !formData.category || !formData.quantity || 
          !formData.unit || !formData.min_quantity || !formData.cost_price) {
        showSnackbar('Lütfen tüm zorunlu alanları doldurun', 'error');
        return;
      }

      const data = {
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        min_quantity: parseFloat(formData.min_quantity),
        cost_price: parseFloat(formData.cost_price),
        notes: formData.notes
      };

      console.log('Gönderilen form verisi:', data); // Debug için

      if (currentItem) {
        await inventoryService.updateInventoryItem(currentItem.id, data);
        showSnackbar('Stok başarıyla güncellendi', 'success');
      } else {
        await inventoryService.createInventoryItem(data);
        showSnackbar('Yeni stok başarıyla eklendi', 'success');
      }

      await fetchInventory();
      setOpenDialog(false);
    } catch (error: any) {
      console.error('Stok kaydetme hatası:', error);
      showSnackbar(
        error.response?.data?.message || 'Stok kaydedilirken bir hata oluştu', 
        'error'
      );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';

      return new Intl.DateTimeFormat('tr-TR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error);
      return '-';
    }
  };

  // Stok seviyesi göstergesi
  const getStockLevelInfo = (item: InventoryItem) => {
    // Minimum miktar 0 ise özel durum
    if (item.min_quantity === 0) {
      return { 
        color: 'success', 
        text: 'Belirlenmemiş', 
        progress: 100,
        isLow: false 
      };
    }
    
    const ratio = item.quantity / item.min_quantity;
    
    // Kritik seviye (minimum miktarın %50'si veya altı)
    if (ratio <= 0.5) {
      return { 
        color: 'error', 
        text: 'Kritik', 
        progress: Math.max(ratio * 100, 5),  // En az %5 göster
        isLow: true
      };
    } 
    // Düşük seviye (minimum miktar veya altı)
    else if (ratio <= 1.0) {
      return { 
        color: 'warning', 
        text: 'Düşük', 
        progress: ratio * 100,
        isLow: true
      };
    } 
    // Normal seviye (minimum miktarın 2 katına kadar)
    else if (ratio <= 2.0) {
      return { 
        color: 'info', 
        text: 'Normal', 
        progress: 75,
        isLow: false
      };
    } 
    // Yüksek seviye
    else {
      return { 
        color: 'success', 
        text: 'Yeterli', 
        progress: 100,
        isLow: false
      };
    }
  };

  // Tab'daki düşük stok sayısını hesapla
  const getLowStockCount = () => {
    return items.filter(item => {
      const stockInfo = getStockLevelInfo(item);
      return stockInfo.isLow;
    }).length;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Stok Yönetimi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
        >
          <Tab label="Tüm Stoklar" />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Düşük Stoklar
                <Chip 
                  label={getLowStockCount()} 
                  size="small" 
                  color="error" 
                  sx={{ ml: 1, minWidth: 28 }}
                />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={categoryFilter}
              label="Kategori"
              onChange={handleCategoryChange}
            >
              {categories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            size="small"
            placeholder="Ürün adına göre ara..."
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
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddItem}
        >
          Yeni Stok Ekle
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      ) : error ? null : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ürün Adı</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Miktar</TableCell>
                  <TableCell>Minimum Miktar</TableCell>
                  <TableCell>Stok Durumu</TableCell>
                  <TableCell>Maliyet</TableCell>
                  <TableCell>Son Güncelleme</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        {searchQuery || categoryFilter !== 'Tümü' 
                          ? 'Arama kriterlerine uygun stok bulunamadı'
                          : 'Henüz stok eklenmemiş'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => {
                      const stockInfo = getStockLevelInfo(item);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {stockInfo.isLow && (
                                <Tooltip title={stockInfo.text}>
                                  <WarningIcon 
                                    color={stockInfo.color === 'error' ? 'error' : 'warning'} 
                                    fontSize="small" 
                                    sx={{ mr: 1 }} 
                                  />
                                </Tooltip>
                              )}
                              {item.name}
                            </Box>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>{item.min_quantity} {item.unit}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                              <Box sx={{ width: '100%' }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={stockInfo.progress} 
                                  color={stockInfo.color as any}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                              <Typography variant="caption" color={`${stockInfo.color}.main`}>
                                {stockInfo.text}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.cost_price)}
                          </TableCell>
                          <TableCell>{formatDate(item.last_update)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Stok Ekle">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleOpenStockUpdate(item)}
                                sx={{ mr: 0.5 }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Düzenle">
                              <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => handleEditItem(item)}
                                sx={{ mr: 0.5 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Sil">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Sayfa başına satır:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </>
      )}

      {/* Stok Ekleme/Düzenleme Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentItem ? 'Stok Düzenle' : 'Yeni Stok Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ürün Adı"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleFormChange}
                  label="Kategori"
                  name="category"
                >
                  {categories.filter(c => c !== 'Tümü').map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Miktar"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Birim"
                name="unit"
                value={formData.unit}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Minimum Miktar"
                name="min_quantity"
                type="number"
                value={formData.min_quantity}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maliyet Fiyatı"
                name="cost_price"
                type="number"
                value={formData.cost_price}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                name="notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleFormChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSaveItem}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Stok Güncelleme Dialog */}
      <Dialog
        open={openStockUpdateDialog}
        onClose={() => setOpenStockUpdateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Stok Güncelleme - {currentItem?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Mevcut Stok: {currentItem?.quantity} {currentItem?.unit}
            </Typography>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>İşlem Tipi</InputLabel>
              <Select
                value={stockUpdateType}
                onChange={(e) => setStockUpdateType(e.target.value as 'add' | 'remove')}
                label="İşlem Tipi"
              >
                <MenuItem value="add">Stok Ekle (+)</MenuItem>
                <MenuItem value="remove">Stok Düşür (-)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Miktar"
              type="number"
              value={stockUpdateAmount}
              onChange={(e) => setStockUpdateAmount(e.target.value)}
              sx={{ mt: 2 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">{currentItem?.unit}</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Açıklama"
              multiline
              rows={2}
              value={stockUpdateNotes}
              onChange={(e) => setStockUpdateNotes(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStockUpdateDialog(false)}>İptal</Button>
          <Button 
            onClick={handleStockUpdate} 
            variant="contained"
            disabled={!stockUpdateAmount || parseFloat(stockUpdateAmount) <= 0}
          >
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory; 