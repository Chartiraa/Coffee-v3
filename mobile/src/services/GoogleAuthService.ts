import {
  GoogleSignin,
  statusCodes,
  type User,
} from '@react-native-google-signin/google-signin';

class GoogleAuthService {
  static async init() {
    GoogleSignin.configure({
      // Bu değeri Google Cloud Console'dan alacağız
      webClientId: '820862583790-921km5ds8j374ehaes41hibkm0nvpmd5.apps.googleusercontent.com',
    });
  }

  static async signIn(): Promise<User | null> {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      return userInfo.user;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Kullanıcı girişi iptal etti');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Giriş işlemi devam ediyor');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play Services mevcut değil');
      } else {
        console.log('Giriş hatası:', error);
      }
      return null;
    }
  }

  static async signOut() {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser?.user || null;
    } catch (error) {
      console.error('Kullanıcı bilgisi alınamadı:', error);
      return null;
    }
  }

  static async isSignedIn(): Promise<boolean> {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('Giriş durumu kontrol hatası:', error);
      return false;
    }
  }
}

export default GoogleAuthService; 