import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TokenHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const error = queryParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      navigate('/login', { 
        state: { error: 'Giriş işlemi sırasında bir hata oluştu.' },
        replace: true 
      });
      return;
    }

    if (token) {
      try {
        // Token'ı localStorage'a kaydet
        localStorage.setItem('token', token);
        
        // URL'i temizle ve ana sayfaya yönlendir
        const targetPath = queryParams.get('redirect_to') || '/';
        navigate(targetPath, { replace: true });
      } catch (error) {
        console.error('Token handling error:', error);
        navigate('/login', { 
          state: { error: 'Token işlenirken bir hata oluştu.' },
          replace: true 
        });
      }
    }
  }, [location, navigate]);

  return null;
};

export default TokenHandler; 