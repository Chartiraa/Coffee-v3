import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

// Basit bir çözüm için sabit değerleri kullanıyoruz
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (user: User): string => {
  // Kullanıcı nesnesinden gerekli bilgileri alıp payload oluşturuyoruz
  const payload = { 
    id: user.id,
    google_id: user.google_id,
    email: user.email,
    role: user.role 
  };
  
  // 7 gün süreli token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Geçersiz token');
  }
}; 