import { Pool } from 'pg';
import db from '../config/database';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface Table {
  id: number;
  name: string;
  capacity: number;
  is_active: boolean;
  location?: string;
  qr_code?: string;
  status?: TableStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTableDTO {
  name: string;
  capacity: number;
  is_active?: boolean;
  location?: string;
  qr_code?: string;
  status?: TableStatus;
}

export interface UpdateTableDTO {
  name?: string;
  capacity?: number;
  is_active?: boolean;
  location?: string;
  qr_code?: string;
  status?: TableStatus;
}

class TableModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async create(tableData: CreateTableDTO): Promise<Table> {
    const result = await this.pool.query(
      `INSERT INTO tables 
       (name, capacity, is_active, location, qr_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        tableData.name,
        tableData.capacity,
        tableData.is_active !== undefined ? tableData.is_active : true,
        tableData.location || null,
        tableData.qr_code || null
      ]
    );

    return result.rows[0];
  }

  async findById(id: number): Promise<Table | null> {
    const result = await this.pool.query(
      'SELECT * FROM tables WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findAll(activeOnly: boolean = false): Promise<Table[]> {
    let query = 'SELECT * FROM tables';
    
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async update(id: number, tableData: UpdateTableDTO): Promise<Table | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (tableData.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(tableData.name);
      paramCount++;
    }

    if (tableData.capacity !== undefined) {
      updates.push(`capacity = $${paramCount}`);
      values.push(tableData.capacity);
      paramCount++;
    }

    if (tableData.is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(tableData.is_active);
      paramCount++;
    }

    if (tableData.location !== undefined) {
      updates.push(`location = $${paramCount}`);
      values.push(tableData.location);
      paramCount++;
    }

    if (tableData.qr_code !== undefined) {
      updates.push(`qr_code = $${paramCount}`);
      values.push(tableData.qr_code);
      paramCount++;
    }

    if (tableData.status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(tableData.status);
      paramCount++;
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE tables 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM tables WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default new TableModel(); 