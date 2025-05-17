import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  TextField,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip as MUITooltip
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  ReceiptLong as ReceiptIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { paymentService, orderService } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Line, LineChart, ComposedChart
} from 'recharts';

// Arayüz tanımlamaları
interface HourlyData {
  hour: number;
  sales: number;
  orders: number;
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
  hourly_sales: HourlyData[];
  top_products: {
    product_id: number;
    product_name: string;
    quantity: number;
    total_sales: number;
  }[];
}

interface Payment {
  id: number;
  order_id: number;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  user_id: number;
  user_name: string;
  table_id?: number;
  table_name?: string;
  table_number?: number;
  notes?: string;
  item_payments?: Array<{
    product_name: string;
    paid_quantity: number;
    product_price: number;
    amount: number;
  }>;
}

interface SalesChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
  rechartsData?: any[];
}

interface HourlyDataItem {
  hour: number;
  formattedHour: string;
  sales: number;
  orders: number;
}

interface ChartDataItem {
  hour: string;
  sales: number;
  orders: number;
}

const Reports: React.FC = () => {
  // State tanımlamaları
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(new Date());
  const [dailySalesReport, setDailySalesReport] = useState<DailySalesReport | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [chartData, setChartData] = useState<SalesChartData | null>(null);

  // Yükleme durumları
  const [loadingDailyReport, setLoadingDailyReport] = useState<boolean>(false);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  // Hata mesajları
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [openAlert, setOpenAlert] = useState<boolean>(false);

  // Tab değişimini işle
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Tarih değişimini işle
  const handleDateChange = async (startDate: Date | null, endDate: Date | null) => {
    if (startDate && endDate) {
      setLoadingDailyReport(true);
      setLoadingPayments(true);
      
      try {
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];
        
        // API çağrılarını paralel olarak yap
        const [salesResponse, paymentsResponse] = await Promise.all([
          paymentService.getSalesReport(formattedStartDate, formattedEndDate),
          paymentService.getPayments(formattedStartDate, formattedEndDate)
        ]);
        
        // State güncellemelerini sıralı yap
        setSelectedStartDate(startDate);
        setSelectedEndDate(endDate);
        
        // Verileri işle ve state'leri güncelle
        handleSalesReportResponse(salesResponse);
        handlePaymentsResponse(paymentsResponse);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        showAlert('Veriler yüklenirken bir hata oluştu!', 'error');
      } finally {
        setLoadingDailyReport(false);
        setLoadingPayments(false);
      }
    }
  };

  // Satış raporu yanıtını işle
  const handleSalesReportResponse = (response: any) => {
    if (!response?.data) {
      setDailySalesReport(null);
      setChartData(null);
      return;
    }

    // Mevcut veri işleme mantığı buraya taşındı
    const reportData: DailySalesReport = {
      date: response.data.start_date,
      total_sales: Number(response.data.total_sales || 0),
      total_orders: Number(response.data.total_orders || 0),
      average_order_value: response.data.average_order_value || 0,
      payment_methods: {
        cash: 0,
        credit_card: 0,
        debit_card: 0,
        other: 0
      },
      hourly_sales: [],
      top_products: Array.isArray(response.data.top_products) ?
        response.data.top_products.map((p: any) => ({
          product_id: Number(p.product_id || 0),
          product_name: p.product_name || 'Bilinmeyen Ürün',
          quantity: Number(p.quantity || 0),
          total_sales: Number(p.total_sales || 0)
        })) : []
    };

    // Ödeme yöntemlerini doldur
    if (response.data.payment_methods && Array.isArray(response.data.payment_methods)) {
      response.data.payment_methods.forEach((method: any) => {
        if (method.payment_method === 'cash') {
          reportData.payment_methods.cash = Number(method.amount) || 0;
        } else if (method.payment_method === 'credit_card') {
          reportData.payment_methods.credit_card = Number(method.amount) || 0;
        } else if (method.payment_method === 'debit_card') {
          reportData.payment_methods.debit_card = Number(method.amount) || 0;
        } else {
          reportData.payment_methods.other += Number(method.amount) || 0;
        }
      });
    }

    // Saatlik verileri oluştur
    if (response.data.payments && Array.isArray(response.data.payments)) {
      const hourlyData: HourlyData[] = Array(24).fill(0).map((_, hour) => ({
        hour,
        sales: 0,
        orders: 0
      }));
      
      response.data.payments.forEach((payment: any) => {
        const paymentDate = new Date(payment.created_at);
        const hour = paymentDate.getHours();
        
        hourlyData[hour].sales += Number(payment.amount) || 0;
        hourlyData[hour].orders += 1;
      });
      
      reportData.hourly_sales = hourlyData;
    } else {
      // Eğer payments verisi yoksa boş saatlik veri oluştur
      reportData.hourly_sales = Array(24).fill(0).map((_, hour) => ({
        hour,
        sales: 0,
        orders: 0
      }));
    }

    setDailySalesReport(reportData);
    
    // Grafik verilerini güncelle
    const chartData = reportData.hourly_sales.map((item: HourlyData) => ({
      hour: `${item.hour < 10 ? '0' + item.hour : item.hour}:00`,
      sales: item.sales,
      orders: item.orders
    }));

    setChartData({
      labels: chartData.map((item: { hour: string }) => item.hour),
      datasets: [
        {
          label: 'Satış (₺)',
          data: chartData.map((item: { sales: number }) => item.sales),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Sipariş Sayısı',
          data: chartData.map((item: { orders: number }) => item.orders),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ],
      rechartsData: chartData
    });
  };

  // Ödemeler yanıtını işle
  const handlePaymentsResponse = (response: any) => {
    if (response?.data && Array.isArray(response.data)) {
      setRecentPayments(response.data);
    } else {
      setRecentPayments([]);
    }
  };

  // Sayfa yüklendiğinde raporları otomatik olarak çek
  useEffect(() => {
    const today = new Date();
    handleDateChange(today, today);
  }, []);

  // Verileri yenile
  const handleRefreshData = () => {
    if (selectedStartDate && selectedEndDate) {
      handleDateChange(selectedStartDate, selectedEndDate);
    }
  };

  // Raporu indir (simüle edilmiş)
  const handleDownloadReport = () => {
    showAlert('Rapor indirme özelliği henüz uygulanmadı!', 'error');
  };

  // Raporu yazdır (simüle edilmiş)
  const handlePrintReport = () => {
    window.print();
  };

  // Hata/bilgi mesajı göster
  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  // Para birimi formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Zaman formatı
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Raporlar ve Analizler
      </Typography>

      <Grid container spacing={3}>
        {/* Özet Kartları */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'primary.light' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {dailySalesReport ? formatCurrency(dailySalesReport.total_sales) : '-'}
                    </Typography>
                    <MoneyIcon fontSize="large" color="primary" />
                  </Box>
                  <Typography color="text.secondary" variant="body2">
                    Günlük Satış Toplamı
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {dailySalesReport ? dailySalesReport.total_orders : '-'}
                    </Typography>
                    <ReceiptIcon fontSize="large" color="success" />
                  </Box>
                  <Typography color="text.secondary" variant="body2">
                    Toplam Sipariş
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'secondary.light' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold" color="secondary.main">
                      {dailySalesReport ? formatCurrency(dailySalesReport.average_order_value) : '-'}
                    </Typography>
                    <TrendingUpIcon fontSize="large" color="secondary" />
                  </Box>
                  <Typography color="text.secondary" variant="body2">
                    Ortalama Sipariş Değeri
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'info.light' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold" color="info.main">
                      {dailySalesReport?.top_products && dailySalesReport.top_products.length > 0 
                        ? dailySalesReport.top_products[0]?.product_name 
                        : '-'}
                    </Typography>
                    <BarChartIcon fontSize="large" color="info" />
                  </Box>
                  <Typography color="text.secondary" variant="body2">
                    En Çok Satan Ürün
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Tarih Seçici ve Eylemler */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Başlangıç Tarihi"
                type="date"
                value={selectedStartDate ? selectedStartDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleDateChange(date, selectedEndDate);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Bitiş Tarihi"
                type="date"
                value={selectedEndDate ? selectedEndDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleDateChange(selectedStartDate, date);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
            
            <Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRefreshData}
                sx={{ mr: 1 }}
              >
                Yenile
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={handleDownloadReport}
                sx={{ mr: 1 }}
              >
                İndir
              </Button>
              <Button
                startIcon={<PrintIcon />}
                onClick={handlePrintReport}
              >
                Yazdır
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Ana İçerik */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Günlük Özet" />
              <Tab label="Ürün Analizi" />
              <Tab label="Ödeme Geçmişi" />
            </Tabs>
            
            <Box sx={{ p: 2 }}>
              {loadingDailyReport ? (
                <Box display="flex" justifyContent="center" p={5}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {activeTab === 0 && (
                    <>
                      {/* Günlük Özet İçerik */}
                      <Box className="chart-container" sx={{ height: 400, width: '100%', mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Saatlik Satış Grafiği
                        </Typography>
                        {chartData && chartData.rechartsData ? (
                          <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart
                              data={chartData.rechartsData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 20,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hour" />
                              <YAxis yAxisId="left" orientation="left" label={{ value: 'Satış (₺)', angle: -90, position: 'insideLeft' }} />
                              <YAxis yAxisId="right" orientation="right" label={{ value: 'Sipariş Sayısı', angle: 90, position: 'insideRight' }} />
                              <RechartsTooltip 
                                formatter={(value: number | string, name: string): [string, string] => {
                                  if (name === 'sales') return [`${formatCurrency(Number(value))}`, 'Satış'];
                                  if (name === 'orders') return [`${value} adet`, 'Sipariş'];
                                  return [String(value), name];
                                }}
                              />
                              <Legend />
                              <Bar yAxisId="left" dataKey="sales" name="Satış (₺)" fill="#8884d8" />
                              <Line yAxisId="right" type="monotone" dataKey="orders" name="Sipariş Sayısı" stroke="#ff7300" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box sx={{ 
                            p: 2, 
                            border: '1px dashed #ccc', 
                            borderRadius: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: 350
                          }}>
                            <CircularProgress />
                          </Box>
                        )}
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Ödeme Yöntemlerine Göre Dağılım
                            </Typography>
                            {dailySalesReport ? (
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Ödeme Yöntemi</TableCell>
                                      <TableCell align="right">Tutar</TableCell>
                                      <TableCell align="right">Oran</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>Nakit</TableCell>
                                      <TableCell align="right">{formatCurrency(dailySalesReport.payment_methods.cash)}</TableCell>
                                      <TableCell align="right">
                                        {dailySalesReport.total_sales > 0 
                                          ? Math.round((dailySalesReport.payment_methods.cash / dailySalesReport.total_sales) * 100)
                                          : 0}%
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Kredi Kartı</TableCell>
                                      <TableCell align="right">{formatCurrency(dailySalesReport.payment_methods.credit_card)}</TableCell>
                                      <TableCell align="right">
                                        {dailySalesReport.total_sales > 0 
                                          ? Math.round((dailySalesReport.payment_methods.credit_card / dailySalesReport.total_sales) * 100) 
                                          : 0}%
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Banka Kartı</TableCell>
                                      <TableCell align="right">{formatCurrency(dailySalesReport.payment_methods.debit_card)}</TableCell>
                                      <TableCell align="right">
                                        {dailySalesReport.total_sales > 0 
                                          ? Math.round((dailySalesReport.payment_methods.debit_card / dailySalesReport.total_sales) * 100)
                                          : 0}%
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Diğer</TableCell>
                                      <TableCell align="right">{formatCurrency(dailySalesReport.payment_methods.other)}</TableCell>
                                      <TableCell align="right">
                                        {dailySalesReport.total_sales > 0 
                                          ? Math.round((dailySalesReport.payment_methods.other / dailySalesReport.total_sales) * 100)
                                          : 0}%
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Alert severity="info">Veri bulunamadı</Alert>
                            )}
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Saatlik Satışlar
                            </Typography>
                            {dailySalesReport ? (
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Saat</TableCell>
                                      <TableCell align="right">Sipariş Sayısı</TableCell>
                                      <TableCell align="right">Satış Tutarı</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {dailySalesReport.hourly_sales.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{`${index < 10 ? '0' + index : index}:00`}</TableCell>
                                        <TableCell align="right">{item.orders}</TableCell>
                                        <TableCell align="right">{formatCurrency(item.sales)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Alert severity="info">Saatlik satış verisi bulunamadı.</Alert>
                            )}
                          </Paper>
                        </Grid>
                      </Grid>
                    </>
                  )}
                  {activeTab === 1 && (
                    <Box>
                      {/* Ürün Analizi İçerik */}
                      <Typography variant="h6" gutterBottom>
                        En Çok Satan Ürünler
                      </Typography>
                      
                      {dailySalesReport && dailySalesReport.top_products.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Ürün Adı</TableCell>
                                <TableCell align="right">Satış Adedi</TableCell>
                                <TableCell align="right">Toplam Satış</TableCell>
                                <TableCell align="right">Ortalama Fiyat</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dailySalesReport.top_products.map((product, index) => (
                                <TableRow key={`${product.product_name}-${index}`}>
                                  <TableCell>{product.product_name}</TableCell>
                                  <TableCell align="right">{product.quantity}</TableCell>
                                  <TableCell align="right">{formatCurrency(product.total_sales)}</TableCell>
                                  <TableCell align="right">
                                    {product.quantity > 0 
                                      ? formatCurrency(product.total_sales / product.quantity)
                                      : formatCurrency(0)
                                    }
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info">Ürün satış verisi bulunamadı.</Alert>
                      )}
                    </Box>
                  )}
                  {activeTab === 2 && (
                    <Box>
                      {/* Ödeme Geçmişi İçerik */}
                      <Typography variant="h6" gutterBottom>
                        Son Ödemeler
                      </Typography>
                      
                      {loadingPayments ? (
                        <Box display="flex" justifyContent="center" p={3}>
                          <CircularProgress />
                        </Box>
                      ) : recentPayments.length === 0 ? (
                        <Alert severity="info">Henüz ödeme bulunmamaktadır.</Alert>
                      ) : (
                        <TableContainer component={Paper} variant="outlined">
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Ödeme ID</TableCell>
                                <TableCell>Sipariş</TableCell>
                                <TableCell>Masa</TableCell>
                                <TableCell>Tarih</TableCell>
                                <TableCell>Ödeme Tipi</TableCell>
                                <TableCell align="right">Tutar</TableCell>
                                <TableCell>Durum</TableCell>
                                <TableCell>Personel</TableCell>
                                <TableCell>Notlar</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {recentPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell>#{payment.id}</TableCell>
                                  <TableCell>#{payment.order_id}</TableCell>
                                  <TableCell>
                                    {payment.table_number ? `Masa ${payment.table_number}` : '-'}
                                  </TableCell>
                                  <TableCell>{formatDateTime(payment.created_at)}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      icon={<PaymentIcon />}
                                      label={
                                        payment.payment_method === 'cash' ? 'Nakit' :
                                        payment.payment_method === 'credit_card' ? 'Kredi Kartı' :
                                        payment.payment_method === 'debit_card' ? 'Banka Kartı' : 'Diğer'
                                      }
                                      size="small"
                                      color={
                                        payment.payment_method === 'cash' ? 'success' :
                                        payment.payment_method === 'credit_card' ? 'primary' :
                                        payment.payment_method === 'debit_card' ? 'info' : 'default'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography fontWeight="bold">
                                      {formatCurrency(payment.amount)}
                                    </Typography>
                                    {payment.item_payments && payment.item_payments.length > 0 && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {payment.item_payments.length} ürün
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={payment.status}
                                      size="small"
                                      color={payment.status === 'completed' ? 'success' : 'warning'}
                                    />
                                  </TableCell>
                                  <TableCell>{payment.user_name || '-'}</TableCell>
                                  <TableCell>
                                    {payment.notes ? (
                                      <MUITooltip title={payment.notes} arrow placement="top">
                                        <Box
                                          sx={{
                                            maxWidth: 200,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            cursor: 'pointer',
                                            '&:hover': {
                                              textDecoration: 'underline'
                                            }
                                          }}
                                        >
                                          <Typography>
                                            {payment.notes}
                                          </Typography>
                                        </Box>
                                      </MUITooltip>
                                    ) : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;