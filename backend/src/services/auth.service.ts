import { User } from '../models/user.model';
import UserModel from '../models/user.model';
import { verifyToken, generateToken } from '../utils/jwt';

class AuthService {
  async validateToken(token: string): Promise<User> {
    try {
      const decoded = verifyToken(token) as { id: number };
      const user = await UserModel.findById(decoded.id);
      
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      return user;
    } catch (error) {
      throw new Error('Geçersiz token');
    }
  }
}

export default new AuthService(); 