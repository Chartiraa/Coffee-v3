import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  Grid, 
  Divider, 
  Button, 
  Card, 
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Kullanıcı profil tipi
interface UserProfile {
  id: number;
  google_id: string;
  email: string;
  full_name: string;
  profile_picture: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

// Kullanıcı tercihleri için interface
interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  language: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    darkMode: true,
    notifications: true,
    language: 'tr'
  });
  const navigate = useNavigate();

  // Profil bilgilerini yükle
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await authService.getProfile();
        setProfile(response.data);
        setError(null);
      } catch (err) {
        console.error('Profil yüklenirken hata oluştu:', err);
        setError('Profil bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Kullanıcı tercihlerini localStorage'dan al
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  // Tercih değişikliklerini kaydet
  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean | string) => {
    const newPreferences = {
      ...preferences,
      [key]: value
    };
    setPreferences(newPreferences);
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));

    // Tema değişikliği burada uygulanabilir (gerçek uygulamada)
  };

  // Çıkış işlemi
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Tab değişikliği
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Yetki adını Türkçe olarak göster
  const getRoleName = (role: string): string => {
    const roleMap: Record<string, string> = {
      'admin': 'Yönetici',
      'manager': 'Müdür',
      'cashier': 'Kasiyer',
      'waiter': 'Garson',
      'barista': 'Barista',
      'pending': 'Onay Bekliyor'
    };
    
    return roleMap[role] || role;
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: Date): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profil
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {profile && (
        <Grid container spacing={3}>
          {/* Profil Kartı */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <Avatar
                  src={profile.profile_picture}
                  alt={profile.full_name}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto', 
                    mb: 2,
                    border: 3, 
                    borderColor: 'primary.main'
                  }}
                />
                <Typography variant="h5" gutterBottom>
                  {profile.full_name}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {profile.email}
                </Typography>
                <Box 
                  sx={{ 
                    mt: 1, 
                    p: 1, 
                    bgcolor: 'primary.main', 
                    color: 'primary.contrastText',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2">
                    {getRoleName(profile.role)}
                  </Typography>
                </Box>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  sx={{ mt: 3 }}
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </Button>
              </CardContent>
            </Card>

            {/* Kullanıcı Eylemleri */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hızlı Erişim
                </Typography>
                <List disablePadding>
                  <ListItem disableGutters>
                    <Button
                      fullWidth
                      startIcon={<VisibilityIcon />}
                      onClick={() => setTabValue(1)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Güvenlik Ayarları
                    </Button>
                  </ListItem>
                  <ListItem disableGutters>
                    <Button
                      fullWidth
                      startIcon={<SettingsIcon />}
                      onClick={() => setTabValue(2)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Tercihler
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Sağ Taraf - Tab İçeriği */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="profile tabs"
                sx={{ mb: 3 }}
              >
                <Tab 
                  icon={<AccountCircleIcon />} 
                  iconPosition="start" 
                  label="Profil" 
                />
                <Tab 
                  icon={<SecurityIcon />} 
                  iconPosition="start" 
                  label="Güvenlik" 
                />
                <Tab 
                  icon={<SettingsIcon />} 
                  iconPosition="start" 
                  label="Tercihler" 
                />
              </Tabs>

              {/* Profil Tab */}
              {tabValue === 0 && (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Hesap Bilgileri
                    </Typography>
                    <IconButton color="primary">
                      <EditIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  
                  <List disablePadding>
                    <ListItem>
                      <ListItemText 
                        primary="Kullanıcı ID" 
                        secondary={profile.id.toString()} 
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Ad Soyad" 
                        secondary={profile.full_name} 
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="E-posta" 
                        secondary={profile.email} 
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Yetki Seviyesi" 
                        secondary={getRoleName(profile.role)} 
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Kayıt Tarihi" 
                        secondary={formatDate(profile.created_at)} 
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                  </List>
                </>
              )}

              {/* Güvenlik Tab */}
              {tabValue === 1 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Güvenlik Ayarları
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Typography variant="body1" paragraph>
                    Coffee v3 uygulaması, Google hesabınız üzerinden güvenli giriş sağlamaktadır. 
                    Şifre veya güvenlik ayarlarınızı değiştirmek için Google hesap ayarlarınızı ziyaret edin.
                  </Typography>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mt: 2 }}
                    onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                  >
                    Google Hesap Ayarlarına Git
                  </Button>
                  
                  <Typography variant="h6" sx={{ mt: 4 }}>
                    Son Giriş Bilgileri
                  </Typography>
                  <Divider sx={{ mb: 2, mt: 1 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Son Giriş Tarihi"
                        secondary="10.06.2023 15:45" // Gerçek bir uygulamada bu veri sunucudan gelir
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Son Giriş Adresi"
                        secondary="Chrome / Windows" // Gerçek bir uygulamada bu veri sunucudan gelir
                      />
                    </ListItem>
                  </List>
                </>
              )}

              {/* Tercihler Tab */}
              {tabValue === 2 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Uygulama Tercihleri
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Karanlık Tema" 
                        secondary="Karanlık renk şemasını kullan" 
                      />
                      <Switch
                        edge="end"
                        checked={preferences.darkMode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePreferenceChange('darkMode', e.target.checked)}
                        icon={<LightModeIcon />}
                        checkedIcon={<DarkModeIcon />}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Bildirimler" 
                        secondary="Uygulama bildirimlerini al" 
                      />
                      <Switch
                        edge="end"
                        checked={preferences.notifications}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePreferenceChange('notifications', e.target.checked)}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Dil" 
                        secondary="Uygulama dili" 
                      />
                      <Box>
                        <Chip 
                          label="Türkçe" 
                          color={preferences.language === 'tr' ? 'primary' : 'default'}
                          onClick={() => handlePreferenceChange('language', 'tr')}
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label="English" 
                          color={preferences.language === 'en' ? 'primary' : 'default'}
                          onClick={() => handlePreferenceChange('language', 'en')}
                        />
                      </Box>
                    </ListItem>
                  </List>

                  <Box sx={{ mt: 3, textAlign: 'right' }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                    >
                      Kaydet
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Profile; 