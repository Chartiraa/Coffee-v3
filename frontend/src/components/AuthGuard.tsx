import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { authService } from '../services/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Token kontrolü
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Token'ın geçerliliğini API üzerinden kontrol etmek istersen:
        try {
          await authService.getProfile();
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token doğrulama hatası:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Doğrulama hatası:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // Kontrol tamamlanana kadar yükleniyor göster
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Giriş yapmamış kullanıcıları login sayfasına yönlendir
  if (!isAuthenticated && location.pathname !== '/login') {
    // Mevcut URL'i state'de saklayarak geri dönüş için kullanabiliriz
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Giriş yapmış kullanıcıları login sayfasından dashboard'a yönlendir
  if (isAuthenticated && location.pathname === '/login') {
    // Eğer daha önce belirli bir sayfaya gitmek istiyorduysa ora yönlendir
    const fromPage = location.state?.from || '/';
    return <Navigate to={fromPage} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard; 