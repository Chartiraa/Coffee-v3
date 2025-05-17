import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { paymentService } from '../services/api';

// Ödeme tipi
interface Payment {
  id: number;
  order_id: number;
  table_number: number;
  amount: number;
  payment_method: string;
  created_at: string;
  cashier_id: number;
  cashier_name: string;
  notes?: string;
  item_payments?: Array<{
    product_name: string;
    paid_quantity: number;
    product_price: number;
    amount: number;
  }>;
}

// Günlük satış raporu
interface DailySalesReport {
  date: string;
  total_sales: number;
  total_orders: number;
  payment_methods: {
    cash: number;
    credit_card: number;
    other: number;
  };
  categories: {
    name: string;
    amount: number;
  }[];
}

// Örnek veriler
const mockPayments: Payment[] = [
  {
    id: 1001,
    order_id: 101,
    table_number: 2,
    amount: 145.70,
    payment_method: 'cash',
    created_at: '2023-05-10T16:30:00',
    cashier_id: 1,
    cashier_name: 'Mehmet Yılmaz'
  },
  {
    id: 1002,
    order_id: 102,
    table_number: 4,
    amount: 250.50,
    payment_method: 'credit_card',
    created_at: '2023-05-10T17:45:00',
    cashier_id: 1,
    cashier_name: 'Mehmet Yılmaz'
  },
  {
    id: 1003,
    order_id: 103,
    table_number: 8,
    amount: 356.00,
    payment_method: 'credit_card',
    created_at: '2023-05-10T18:20:00',
    cashier_id: 2,
    cashier_name: 'Ayşe Kaya'
  },
  {
    id: 1004,
    order_id: 104,
    table_number: 1,
    amount: 92.80,
    payment_method: 'cash',
    created_at: '2023-05-10T19:05:00',
    cashier_id: 2,
    cashier_name: 'Ayşe Kaya'
  },
  {
    id: 1005,
    order_id: 105,
    table_number: 6,
    amount: 178.40,
    payment_method: 'cash',
    created_at: '2023-05-10T19:30:00',
    cashier_id: 1,
    cashier_name: 'Mehmet Yılmaz'
  }
];

// Örnek günlük rapor
const mockDailyReport: DailySalesReport = {
  date: '2023-05-10',
  total_sales: 1023.40,
  total_orders: 5,
  payment_methods: {
    cash: 416.90,
    credit_card: 606.50,
    other: 0
  },
  categories: [
    { name: 'Kahveler', amount: 429.70 },
    { name: 'Çaylar', amount: 95.40 },
    { name: 'Tatlılar', amount: 279.50 },
    { name: 'Atıştırmalıklar', amount: 218.80 }
  ]
};

// Grafik verileri
const mockSalesChartData = [
  { name: '4 Mayıs', sales: 856.20 },
  { name: '5 Mayıs', sales: 920.40 },
  { name: '6 Mayıs', sales: 1250.30 },
  { name: '7 Mayıs', sales: 980.50 },
  { name: '8 Mayıs', sales: 740.80 },
  { name: '9 Mayıs', sales: 890.60 },
  { name: '10 Mayıs', sales: 1023.40 }
];

// Pasta grafik renkleri
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Payments: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [dailyReport, setDailyReport] = useState<DailySalesReport | null>(mockDailyReport);
  const [loading, setLoading] = useState<boolean>(false);
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [openPaymentDialog, setOpenPaymentDialog] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [chartData, setChartData] = useState(mockSalesChartData);
  const [cashRegisterBalance, setCashRegisterBalance] = useState<number>(1850.75);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  // Gerçek uygulamada API'den veri çekilecek
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const paymentsResponse = await paymentService.getPayments();
        setPayments(paymentsResponse.data);
        
        const reportResponse = await paymentService.getDailySalesReport(reportDate);
        setDailyReport(reportResponse.data);
        
        const balanceResponse = await paymentService.getCashRegisterBalance();
        setCashRegisterBalance(balanceResponse.data.balance);
      } catch (error) {
        console.error('Ödeme verilerini çekerken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportDate]);

  // Son ödemeleri çek
  const fetchRecentPayments = async () => {
    setLoadingPayments(true);
    try {
      const response = await paymentService.getPayments();
      console.log("Ödeme geçmişi API yanıtı:", response.data);
      setRecentPayments(response.data);
    } catch (error) {
      console.error('Ödeme geçmişi yüklenirken hata:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  // Ödeme detaylarını göster
  const handleViewPayment = async (payment: Payment) => {
    try {
      const response = await paymentService.getPaymentDetails(payment.id);
      setSelectedPayment(response.data);
      setOpenPaymentDialog(true);
    } catch (error) {
      console.error('Ödeme detayları yüklenirken hata:', error);
    }
  };

  // Filtreleme işlemleri
  const filteredPayments = recentPayments.filter(payment => {
    // Ödeme yöntemi filtresi
    if (paymentMethodFilter !== 'all' && payment.payment_method !== paymentMethodFilter) {
      return false;
    }
    
    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.id.toString().includes(query) ||
        payment.order_id.toString().includes(query) ||
        payment.table_number.toString().includes(query) ||
        (payment.cashier_name && payment.cashier_name.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Tab değişikliğinde filtreleme yapıldığında burada işlenecek
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handlePaymentMethodFilterChange = (event: SelectChangeEvent) => {
    setPaymentMethodFilter(event.target.value as string);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReportDate(event.target.value);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Nakit';
      case 'credit_card':
        return 'Kredi Kartı';
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <LocalAtmIcon fontSize="small" />;
      case 'credit_card':
        return <CreditCardIcon fontSize="small" />;
      default:
        return <AccountBalanceWalletIcon fontSize="small" />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ödeme Geçmişi
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Ödeme Türü</InputLabel>
            <Select
              value={paymentMethodFilter}
              label="Ödeme Türü"
              onChange={handlePaymentMethodFilterChange}
            >
              <MenuItem value="all">Tümü</MenuItem>
              <MenuItem value="cash">Nakit</MenuItem>
              <MenuItem value="credit_card">Kredi Kartı</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            size="small"
            placeholder="Ödeme ara..."
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
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
        >
          Yazdır
        </Button>
      </Box>

      {loadingPayments ? (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ödeme ID</TableCell>
                <TableCell>Sipariş No</TableCell>
                <TableCell>Masa</TableCell>
                <TableCell>Tutar</TableCell>
                <TableCell>Ödeme Türü</TableCell>
                <TableCell>Tarih</TableCell>
                <TableCell>Kasiyer</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      Ödeme bulunamadı
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>#{payment.id}</TableCell>
                    <TableCell>#{payment.order_id}</TableCell>
                    <TableCell>Masa {payment.table_number}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={getPaymentMethodIcon(payment.payment_method)} 
                        label={getPaymentMethodText(payment.payment_method)} 
                        size="small" 
                        color={payment.payment_method === 'cash' ? 'success' : 'primary'} 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(payment.created_at)}</TableCell>
                    <TableCell>{payment.cashier_name}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewPayment(payment)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Ödeme Detay Dialog */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Ödeme Detayı - #{selectedPayment?.id}
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Ödeme No:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  #{selectedPayment.id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Sipariş No:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  #{selectedPayment.order_id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Masa No:
                </Typography>
                <Typography variant="body1">
                  Masa {selectedPayment.table_number}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Ödeme Türü:
                </Typography>
                <Chip 
                  icon={getPaymentMethodIcon(selectedPayment.payment_method)} 
                  label={getPaymentMethodText(selectedPayment.payment_method)} 
                  size="small" 
                  color={selectedPayment.payment_method === 'cash' ? 'success' : 'primary'} 
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Tutar:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formatCurrency(selectedPayment.amount)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Tarih:
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedPayment.created_at)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Kasiyer:
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.cashier_name}
                </Typography>
              </Grid>
              {selectedPayment.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Notlar:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.notes}
                  </Typography>
                </Grid>
              )}
              {selectedPayment.item_payments && selectedPayment.item_payments.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Ödenen Ürünler
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ürün</TableCell>
                          <TableCell align="right">Miktar</TableCell>
                          <TableCell align="right">Birim Fiyat</TableCell>
                          <TableCell align="right">Toplam</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPayment.item_payments.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell align="right">{item.paid_quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.product_price)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>
            Kapat
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Yazdır
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments; 