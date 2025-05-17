import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import { authService } from '../services/api';

// Basit bir token kontrolü
const checkAuth = (): boolean => {
  return localStorage.getItem('token') !== null;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
    if (checkAuth()) {
      navigate('/');
    }
    
    // URL'den token parametresini kontrol et (Google OAuth yönlendirmesinden)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    
    if (error) {
      setError('Giriş işlemi sırasında bir hata oluştu: ' + error);
      // URL'i temizle
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (token) {
      try {
        // Token'ı localStorage'a kaydet
        localStorage.setItem('token', token);
        
        // URL'i temizle
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setSuccess('Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...');
        
        // Kullanıcıyı yönlendir
        const from = location.state?.from || '/';
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      } catch (err) {
        setError('Token doğrulanırken hata oluştu.');
      }
    }
  }, [navigate, location]);

  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);
    
    // Gerçek backend API'sine yönlendir
    window.location.href = 'http://localhost:3000/api/v1/auth/google';
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Coffee v3
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Kafe Otomasyon Sistemi
        </Typography>
        
        <Box sx={{ mt: 4, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={!loading && <GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Google ile Giriş Yap'}
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          &copy; {new Date().getFullYear()} Coffee v3 - Tüm hakları saklıdır
        </Typography>
      </Box>
    </Container>
  );
};

export default Login; 