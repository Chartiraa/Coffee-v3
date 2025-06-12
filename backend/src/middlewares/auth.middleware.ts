import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';
import { User } from '../models/user.model';

// User tipinin Request'e doğru şekilde tanımlanması
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Geçici olarak tüm istekler için kimlik doğrulamayı atlayan middleware
export const skipAuthForMobile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Tüm istekler için varsayılan bir kullanıcı oluştur
  (req as AuthenticatedRequest).user = {
    id: 1,
    google_id: '106829416848003696669',
    email: 'akifcanzdmr@gmail.com',
    full_name: 'Mehmet Akif Can Özdemir',
    profile_picture: '',
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date()
  };
  return next();
};

// Geçici olarak kimlik doğrulamayı atlayan middleware
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Geçici olarak varsayılan kullanıcıyı ayarla
  req.user = {
    id: 1,
    google_id: '106829416848003696669',
    email: 'akifcanzdmr@gmail.com',
    full_name: 'Mehmet Akif Can Özdemir',
    profile_picture: '',
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date()
  };
  next();
};

export const authorize = (...roles: User['role'][]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    next();
  };
}; 