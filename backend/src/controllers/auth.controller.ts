import { Request, Response } from 'express';
import UserModel, { User } from '../models/user.model';
import { generateToken } from '../utils/jwt';

interface AuthenticatedRequest extends Request {
  user?: User;
}

class AuthController {
  constructor() {
    this.googleCallback = this.googleCallback.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.listPendingUsers = this.listPendingUsers.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
    this.listAllUsers = this.listAllUsers.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
  }

  async googleCallback(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        const redirectUri = req.query.redirect_uri as string || process.env.FRONTEND_URL;
        return res.redirect(`${redirectUri}/auth-error`);
      }

      const token = generateToken(user);
      const redirectUri = req.query.redirect_uri as string || process.env.FRONTEND_URL;
      res.redirect(`${redirectUri}?token=${token}`);
    } catch (error) {
      const redirectUri = req.query.redirect_uri as string || process.env.FRONTEND_URL;
      res.redirect(`${redirectUri}/auth-error`);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
      }

      res.json(req.user);
    } catch (error) {
      res.status(500).json({ error: 'Beklenmeyen bir hata oluştu' });
    }
  }

  async listPendingUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const users = await UserModel.listPendingUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Beklenmeyen bir hata oluştu' });
    }
  }

  async updateUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const { userId, role } = req.body;

      // Admin rolünü sadece admin verebilir
      if (role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin rolünü sadece admin kullanıcılar atayabilir' });
      }

      const updatedUser = await UserModel.updateRole(userId, role);
      if (!updatedUser) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Beklenmeyen bir hata oluştu' });
    }
  }

  async listAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const users = await UserModel.listAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Beklenmeyen bir hata oluştu' });
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      // Sadece admin ve manager kullanıcıları silebilir
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const userId = parseInt(req.params.id);
      
      // Kullanıcıyı kontrol et
      const userToDelete = await UserModel.findById(userId);
      
      if (!userToDelete) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }
      
      // Admin kullanıcıları sadece adminler silebilir
      if (userToDelete.role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin kullanıcıları sadece admin silebilir' });
      }
      
      // Kullanıcı kendisini silmeye çalışıyor mu?
      if (userToDelete.id === req.user.id) {
        return res.status(400).json({ error: 'Kendinizi silemezsiniz' });
      }

      const deleted = await UserModel.delete(userId);
      
      if (!deleted) {
        return res.status(500).json({ error: 'Kullanıcı silinemedi' });
      }

      res.status(200).json({ message: 'Kullanıcı başarıyla silindi' });
    } catch (error) {
      res.status(500).json({ error: 'Beklenmeyen bir hata oluştu' });
    }
  }
}

export default new AuthController(); 