import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Badge,
  IconButton,
  Card,
  CardContent,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WeekendIcon from '@mui/icons-material/Weekend';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import { tableService } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Masa durumları
enum TableStatus {
  EMPTY = 'empty',      // Boş masa (Backend: 'available')
  OCCUPIED = 'occupied', // Dolu masa (Backend: 'occupied')
  RESERVED = 'reserved', // Rezerve masa (Backend: 'reserved')
  MAINTENANCE = 'maintenance' // Bakımda olan masa (Backend: 'maintenance')
}

// Masa tipi
interface Table {
  id: number;
  number: number;
  capacity: number;
  status: TableStatus;
  active: boolean;
  order_count?: number;
  current_order_id?: number | null;
  customer_count?: number | null;
  location?: string;
}

// Örnek veri
const mockTables: Table[] = [
];

// Lokasyon filtreleri
const locations = ['Tümü', 'İç Alan', 'Teras', 'Bahçe'];

const Tables: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [loading, setLoading] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('Tümü');
  const [orderBy, setOrderBy] = useState<string>('number');
  const [openTableActionDialog, setOpenTableActionDialog] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);

  // Form state'i
  const [tableForm, setTableForm] = useState({
    number: 1,
    capacity: 2,
    location: 'İç Alan',
    status: TableStatus.EMPTY
  });

  // API'den veri çekiyoruz
  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        console.log("Masalar API'den getiriliyor...");
        const response = await tableService.getTables();
        console.log("API yanıtı alındı:", response.data);
        
        // Backend formatını frontend formatına dönüştür
        const formattedTables = response.data.map((table: any) => {
          // Backend'den gelen status alanını frontend formatına dönüştür
          const frontendStatus = mapBackendStatusToFrontend(table.status || 'available');
          
          console.log(`Masa ${table.id}: Backend statusu '${table.status}' -> Frontend statusu '${frontendStatus}'`);
          
          return {
            id: table.id,
            number: parseInt(table.name.replace('Masa ', '')) || table.id, // "Masa X" formatından X sayısını çıkar
            capacity: table.capacity,
            status: frontendStatus,
            active: table.is_active,
            location: table.location || 'İç Alan'
          };
        });
        
        console.log("Frontend formatına dönüştürülen masalar:", formattedTables);
        setTables(formattedTables);
      } catch (error) {
        console.error('Masa verilerini çekerken hata oluştu:', error);
        setErrorMessage('Masa verilerini çekerken bir hata oluştu. Lütfen sayfayı yenileyin.');
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Backend status değerlerini frontend enum'a dönüştür
  const mapBackendStatusToFrontend = (backendStatus: string): TableStatus => {
    switch (backendStatus) {
      case 'available':
        return TableStatus.EMPTY;
      case 'occupied':
        return TableStatus.OCCUPIED;
      case 'reserved':
        return TableStatus.RESERVED;
      case 'maintenance':
        return TableStatus.MAINTENANCE;
      default:
        return TableStatus.EMPTY;
    }
  };

  const handleTableFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setTableForm({
      ...tableForm,
      [name]: value
    });
  };

  const handleAddTable = () => {
    setCurrentTable(null);
    setTableForm({
      number: tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1,
      capacity: 2,
      location: 'İç Alan',
      status: TableStatus.EMPTY
    });
    setOpenDialog(true);
  };

  const handleEditTable = (table: Table) => {
    setCurrentTable(table);
    setTableForm({
      number: table.number,
      capacity: table.capacity,
      location: table.location || 'İç Alan',
      status: table.status
    });
    setOpenDialog(true);
  };

  const handleDeleteTable = async (tableId: number) => {
    try {
      // API isteği
      await tableService.deleteTable(tableId);
      
      // UI'ı güncelle
      setTables(tables.filter(table => table.id !== tableId));
    } catch (error) {
      console.error('Masa silinirken hata oluştu:', error);
    }
  };

  // Masa numarasının mevcut olup olmadığını kontrol eden fonksiyon
  const checkIfTableNumberExists = (number: number): boolean => {
    if (currentTable && currentTable.number === number) {
      // Düzenleme sırasında aynı numara kullanılabilir
      return false;
    }
    return tables.some(table => table.number === number);
  };

  const handleSaveTable = async () => {
    try {
      const tableNumber = Number(tableForm.number);
      
      // Masa numarası kontrolü
      if (checkIfTableNumberExists(tableNumber)) {
        setErrorMessage(`${tableNumber} numaralı masa zaten mevcut. Lütfen başka bir numara seçin.`);
        setShowError(true);
        return;
      }
      
      // Backend API'sine gönderilecek veri yapısını oluştur
      const tableDataForApi = {
        name: `Masa ${tableNumber}`, // Backend'in beklediği alan adı "name"
        capacity: Number(tableForm.capacity),
        is_active: true,
        location: tableForm.location
      };
      
      if (currentTable) {
        // Güncelleme işlemi
        const response = await tableService.updateTable(currentTable.id, tableDataForApi);
        
        // Masa listesini güncelle (API'den dönen veriyi frontend formatına dönüştür)
        const updatedTable = {
          ...response.data,
          id: response.data.id,
          number: tableNumber,
          capacity: response.data.capacity,
          status: tableForm.status,
          active: response.data.is_active,
          location: response.data.location
        };
        
        setTables(tables.map(t => 
          t.id === currentTable.id ? updatedTable : t
        ));
      } else {
        // Yeni masa ekleme işlemi
        const response = await tableService.createTable(tableDataForApi);
        
        // API'den dönen veriyi frontend formatına dönüştür
        const newTable = {
          id: response.data.id,
          number: tableNumber,
          capacity: response.data.capacity,
          status: tableForm.status,
          active: response.data.is_active || true,
          location: response.data.location
        };
        
        // Yeni masayı listeye ekle
        setTables([...tables, newTable]);
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Masa kaydedilirken hata oluştu:', error);
      setErrorMessage('Masa kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setShowError(true);
    }
  };

  const handleOpenTableActions = (table: Table) => {
    setSelectedTable(table);
    setOpenTableActionDialog(true);
  };

  /**
   * Masa durumunu güncelleyen fonksiyon
   * Bu fonksiyon artık özel '/tables/:id/status' endpoint'ini kullanıyor
   * Sürece dahili olarak, masa durumu 'available' (boş) olarak değiştirildiğinde:
   * 1. Masadaki tüm aktif siparişler otomatik olarak "tamamlandı" olarak işaretlenir
   * 2. Eğer ödenmemiş tutar yoksa, masa ödeme kaydı kapatılır
   * 
   * Masa durumu 'occupied' (dolu) olarak değiştirildiğinde:
   * 1. Eğer yoksa, masaya yeni bir ödeme kaydı oluşturulur
   */
  const handleStatusChange = async (tableId: number, newStatus: TableStatus) => {
    try {
      // TableStatus enum değerini backend'in beklediği formata dönüştürme
      let backendStatus: string;
      
      switch (newStatus) {
        case TableStatus.EMPTY:
          backendStatus = 'available';
          break;
        case TableStatus.OCCUPIED:
          backendStatus = 'occupied';
          break;
        case TableStatus.RESERVED:
          backendStatus = 'reserved';
          break;
        case TableStatus.MAINTENANCE:
          backendStatus = 'maintenance';
          break;
        default:
          backendStatus = 'available';
      }
      
      console.log(`Masa durumu güncelleniyor - Masa ID: ${tableId}, Yeni durum: ${backendStatus}`);
      
      // Özel status endpoint'ini kullan ve yanıtı al
      const response = await tableService.updateTableStatus(tableId, { status: backendStatus });
      console.log("Backend yanıtı:", response.data);
      
      // UI'ı güncelle
      setTables(tables.map(table => {
        if (table.id === tableId) {
          console.log(`Masa durumu güncellendi: ${table.status} -> ${newStatus}`);
          return { ...table, status: newStatus };
        }
        return table;
      }));
      
      // Eğer seçili masa varsa ve o masanın durumu güncelleniyorsa, seçili masayı da güncelle
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable({ ...selectedTable, status: newStatus });
      }
      
      if (openTableActionDialog) {
        setOpenTableActionDialog(false);
      }
    } catch (error) {
      console.error('Masa durumu güncellenirken hata oluştu:', error);
      setErrorMessage('Masa durumu güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      setShowError(true);
    }
  };

  // Sipariş görüntüleme sayfasına yönlendirme
  const handleViewOrders = (tableId: number) => {
    navigate(`/orders?table=${tableId}`);
  };

  // Yeni sipariş ekleme sayfasına yönlendirme
  const handleAddOrder = (tableId: number) => {
    navigate(`/orders/new?table=${tableId}`);
  };

  // Hesap alma/masayı kapatma işlemi
  const handleCloseTable = (tableId: number) => {
    navigate(`/payments/new?table=${tableId}`);
  };

  // Filtreleme
  const filteredTables = tables.filter(table => {
    // Status filter
    if (statusFilter !== 'all' && table.status !== statusFilter) {
      return false;
    }
    
    // Location filter
    if (locationFilter !== 'Tümü' && table.location !== locationFilter) {
      return false;
    }
    
    return true;
  });

  // Sıralama
  const sortedTables = [...filteredTables].sort((a, b) => {
    if (orderBy === 'number') {
      return a.number - b.number;
    } else if (orderBy === 'capacity') {
      return a.capacity - b.capacity;
    } else if (orderBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Masa durumuna göre renk ve ikon belirleme
  const getTableProps = (status: TableStatus) => {
    switch (status) {
      case TableStatus.EMPTY:
        return { color: 'success.main', icon: <WeekendIcon sx={{ fontSize: 40 }} /> };
      case TableStatus.OCCUPIED:
        return { color: 'error.main', icon: <RestaurantIcon sx={{ fontSize: 40 }} /> };
      case TableStatus.RESERVED:
        return { color: 'warning.main', icon: <EventSeatIcon sx={{ fontSize: 40 }} /> };
      case TableStatus.MAINTENANCE:
        return { color: 'grey.500', icon: <WeekendIcon sx={{ fontSize: 40 }} /> };
      default:
        return { color: 'text.primary', icon: <WeekendIcon sx={{ fontSize: 40 }} /> };
    }
  };

  // Durumu Türkçe olarak görüntüleme
  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case TableStatus.EMPTY:
        return 'Boş';
      case TableStatus.OCCUPIED:
        return 'Dolu';
      case TableStatus.RESERVED:
        return 'Rezerve';
      case TableStatus.MAINTENANCE:
        return 'Bakımda';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Masa Yönetimi</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddTable}
        >
          Yeni Masa
        </Button>
      </Box>

      {/* Filtreler */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Durum</InputLabel>
              <Select
                value={statusFilter}
                label="Durum"
                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value={TableStatus.EMPTY}>Boş</MenuItem>
                <MenuItem value={TableStatus.OCCUPIED}>Dolu</MenuItem>
                <MenuItem value={TableStatus.RESERVED}>Rezerve</MenuItem>
                <MenuItem value={TableStatus.MAINTENANCE}>Bakımda</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Konum</InputLabel>
              <Select
                value={locationFilter}
                label="Konum"
                onChange={(e: SelectChangeEvent) => setLocationFilter(e.target.value)}
              >
                {locations.map(location => (
                  <MenuItem key={location} value={location}>{location}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sırala</InputLabel>
              <Select
                value={orderBy}
                label="Sırala"
                onChange={(e: SelectChangeEvent) => setOrderBy(e.target.value)}
              >
                <MenuItem value="number">Masa No</MenuItem>
                <MenuItem value="capacity">Kapasite</MenuItem>
                <MenuItem value="status">Durum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box display="flex" justifyContent="flex-end">
              <Chip 
                label={`Toplam: ${tables.length} masa`} 
                color="primary" 
                variant="outlined" 
                sx={{ mr: 1 }} 
              />
              <Chip 
                label={`Dolu: ${tables.filter(t => t.status === TableStatus.OCCUPIED).length}`} 
                color="error" 
                variant="outlined" 
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {sortedTables.map(table => {
            const { color, icon } = getTableProps(table.status);
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
                <Card 
                  sx={{ 
                    position: 'relative',
                    border: 1,
                    borderColor: color,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    },
                    height: '100%'
                  }}
                >
                  <CardContent>
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center" 
                      mb={2}
                    >
                      <Typography variant="h5" component="div" fontWeight="bold">
                        Masa {table.number}
                      </Typography>
                      <Chip 
                        label={getStatusText(table.status)} 
                        sx={{ bgcolor: color, color: 'white' }} 
                        size="small"
                      />
                    </Box>
                    
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center" 
                      mb={2}
                      sx={{ color }}
                    >
                      {table.status === TableStatus.OCCUPIED ? (
                        <Badge 
                          badgeContent={table.customer_count} 
                          color="primary" 
                          max={99}
                        >
                          {icon}
                        </Badge>
                      ) : (
                        icon
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Kapasite:
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                          {table.capacity} kişi
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Konum:
                      </Typography>
                      <Typography variant="body2">
                        {table.location}
                      </Typography>
                    </Box>
                    
                    {table.status === TableStatus.OCCUPIED && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Sipariş No:
                        </Typography>
                        <Typography variant="body2" color="primary">
                          #{table.current_order_id}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    p={1} 
                    sx={{ borderTop: 1, borderColor: 'divider' }}
                  >
                    <Tooltip title="Masa İşlemleri">
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleOpenTableActions(table)}
                        fullWidth
                        sx={{ mr: 1 }}
                      >
                        İşlemler
                      </Button>
                    </Tooltip>
                    
                    <Box>
                      <Tooltip title="Düzenle">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditTable(table)}
                          sx={{ mr: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Sil">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Masa Ekleme/Düzenleme Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentTable ? 'Masa Düzenle' : 'Yeni Masa Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Masa Numarası"
                  name="number"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={tableForm.number}
                  onChange={handleTableFormChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Kapasite"
                  name="capacity"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={tableForm.capacity}
                  onChange={handleTableFormChange}
                />
              </Grid>
            </Grid>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Konum</InputLabel>
              <Select
                name="location"
                value={tableForm.location}
                onChange={handleTableFormChange}
              >
                <MenuItem value="İç Alan">İç Alan</MenuItem>
                <MenuItem value="Teras">Teras</MenuItem>
                <MenuItem value="Bahçe">Bahçe</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Durum</InputLabel>
              <Select
                name="status"
                value={tableForm.status}
                onChange={handleTableFormChange}
              >
                <MenuItem value={TableStatus.EMPTY}>Boş</MenuItem>
                <MenuItem value={TableStatus.OCCUPIED}>Dolu</MenuItem>
                <MenuItem value={TableStatus.RESERVED}>Rezerve</MenuItem>
                <MenuItem value={TableStatus.MAINTENANCE}>Bakımda</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveTable}
            disabled={!tableForm.number || tableForm.number < 1 || !tableForm.capacity || tableForm.capacity < 1}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Masa İşlemleri Dialog */}
      <Dialog 
        open={openTableActionDialog} 
        onClose={() => setOpenTableActionDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Masa {selectedTable?.number} İşlemleri
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              disabled={selectedTable?.status === TableStatus.OCCUPIED}
              onClick={() => selectedTable && handleStatusChange(selectedTable.id, TableStatus.OCCUPIED)}
              startIcon={<RestaurantIcon />}
            >
              Masayı Dolu Olarak İşaretle
            </Button>
            
            <Button 
              variant="contained" 
              color="success"
              disabled={selectedTable?.status === TableStatus.EMPTY}
              onClick={() => selectedTable && handleStatusChange(selectedTable.id, TableStatus.EMPTY)}
              startIcon={<WeekendIcon />}
            >
              Masayı Boşalt
            </Button>
            
            <Button 
              variant="contained" 
              color="warning"
              disabled={selectedTable?.status === TableStatus.RESERVED}
              onClick={() => selectedTable && handleStatusChange(selectedTable.id, TableStatus.RESERVED)}
              startIcon={<EventSeatIcon />}
            >
              Masayı Rezerve Et
            </Button>
            
            <Button 
              variant="contained" 
              color="inherit"
              disabled={selectedTable?.status === TableStatus.MAINTENANCE}
              onClick={() => selectedTable && handleStatusChange(selectedTable.id, TableStatus.MAINTENANCE)}
              startIcon={<WeekendIcon />}
              sx={{ color: 'text.secondary' }}
            >
              Bakım Durumuna Al
            </Button>
            
            <Divider sx={{ my: 1 }} />
            
            <Button 
              variant="outlined" 
              color="primary"
              disabled={selectedTable?.status !== TableStatus.OCCUPIED}
              startIcon={<ReceiptIcon />}
              onClick={() => selectedTable && handleViewOrders(selectedTable.id)}
            >
              Siparişleri Görüntüle
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary"
              disabled={selectedTable?.status !== TableStatus.OCCUPIED}
              startIcon={<AddShoppingCartIcon />}
              onClick={() => selectedTable && handleAddOrder(selectedTable.id)}
            >
              Yeni Sipariş Ekle
            </Button>
            
            <Button 
              variant="outlined" 
              color="error"
              disabled={selectedTable?.status !== TableStatus.OCCUPIED}
              startIcon={<PaymentIcon />}
              onClick={() => selectedTable && handleCloseTable(selectedTable.id)}
            >
              Masayı Kapat / Hesabı Al
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTableActionDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Tables; 