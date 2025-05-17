import { Pool, QueryResult } from 'pg';
import db from '../config/database';

export interface User {
  id: number;
  google_id: string;
  email: string;
  full_name: string;
  profile_picture: string;
  role: 'admin' | 'manager' | 'waiter' | 'cashier' | 'barista' | 'pending';
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  full_name: string;
  role: User['role'];
}

export interface UpdateUserDTO {
  full_name?: string;
  role?: User['role'];
  password?: string;
}

class UserModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async create(userData: CreateUserDTO): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (username, password, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userData.username, userData.password, userData.full_name, userData.role]
    );

    return result.rows[0];
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    return result.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async update(id: number, userData: UpdateUserDTO): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (userData.full_name) {
      updates.push(`full_name = $${paramCount}`);
      values.push(userData.full_name);
      paramCount++;
    }

    if (userData.role) {
      updates.push(`role = $${paramCount}`);
      values.push(userData.role);
      paramCount++;
    }

    if (userData.password) {
      updates.push(`password = $${paramCount}`);
      values.push(userData.password);
      paramCount++;
    }

    if (updates.length === 0) return null;

    values.push(id);
    const result = await this.pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result: QueryResult = await this.pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  async list(): Promise<User[]> {
    const result = await this.pool.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    return result.rows;
  }

  async findOrCreateGoogleUser(profile: any): Promise<User> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }

    // Yeni kullanıcı oluştur (varsayılan olarak pending rolü ile)
    const newUser = await this.pool.query(
      `INSERT INTO users (google_id, email, full_name, profile_picture, role)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [
        profile.id,
        profile.emails[0].value,
        profile.displayName,
        profile.photos[0].value
      ]
    );

    return newUser.rows[0];
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    return result.rows[0] || null;
  }

  async updateRole(id: number, role: User['role']): Promise<User | null> {
    const result = await this.pool.query(
      `UPDATE users 
       SET role = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [role, id]
    );

    return result.rows[0] || null;
  }

  async listPendingUsers(): Promise<User[]> {
    const result = await this.pool.query(
      "SELECT * FROM users WHERE role = 'pending' ORDER BY created_at DESC"
    );

    return result.rows;
  }

  async listAllUsers(): Promise<User[]> {
    const result = await this.pool.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    return result.rows;
  }
}

export default new UserModel(); 