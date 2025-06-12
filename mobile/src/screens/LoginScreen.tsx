import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { Button, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';

const API_URL = 'http://192.168.1.65:3000/api/v1';

const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{
    device_id: string;
    device_name: string;
  } | null>(null);

  // Device bilgilerini al
  useEffect(() => {
    const getDeviceInfo = async () => {
      const deviceName = Device.modelName || Platform.OS;
      let deviceId = 'unknown';

      if (Platform.OS === 'ios') {
        deviceId = (await Application.getIosIdForVendorAsync()) || 'unknown-ios';
      } else {
        deviceId = (await Application.getAndroidId()) || 'unknown-android';
      }

      setDeviceInfo({
        device_id: deviceId,
        device_name: deviceName
      });
    };

    getDeviceInfo();
  }, []);

  // URL'den token'ı kontrol et
  useEffect(() => {
    const checkUrlToken = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          const params = new URL(url).searchParams;
          const token = params.get('token');
          const error = params.get('error');

          if (error) {
            setError('Giriş işlemi sırasında bir hata oluştu: ' + error);
            return;
          }

          if (token) {
            await AsyncStorage.setItem('token', token);
            navigation.replace('Main');
          }
        }
      } catch (err) {
        console.error('URL token kontrolü hatası:', err);
      }
    };

    checkUrlToken();
  }, [navigation]);

  // Kullanıcı zaten giriş yapmış mı kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.replace('Main');
      }
    };

    checkAuth();
  }, [navigation]);

  const handleGoogleLogin = async () => {
    try {
      if (!deviceInfo) {
        setError('Cihaz bilgileri alınamadı');
        return;
      }

      setLoading(true);
      setError(null);

      // Google login URL'ini oluştur
      const loginUrl = `${API_URL}/auth/google?device_id=${encodeURIComponent(deviceInfo.device_id)}&device_name=${encodeURIComponent(deviceInfo.device_name)}`;
      console.log('Login URL:', loginUrl);
      
      // Web Browser'ı aç
      const result = await WebBrowser.openAuthSessionAsync(loginUrl, 'coffeev3://');
      
      if (result.type === 'success') {
        const url = result.url;
        const params = new URL(url).searchParams;
        const token = params.get('token');
        const error = params.get('error');

        if (error) {
          setError('Giriş işlemi sırasında bir hata oluştu: ' + error);
          return;
        }

        if (token) {
          await AsyncStorage.setItem('token', token);
          navigation.replace('Main');
        }
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu');
      console.error('Login hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Coffee v3
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Kafe Otomasyon Sistemi
        </Text>

        {error && (
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleGoogleLogin}
          loading={loading}
          style={styles.button}
          icon="google"
        >
          Google ile Giriş Yap
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          © {new Date().getFullYear()} Coffee v3 - Tüm hakları saklıdır
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 300,
    marginTop: 16,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
  },
});

export default LoginScreen; 