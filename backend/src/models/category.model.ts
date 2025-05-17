import { Pool } from 'pg';
import db from '../config/database';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

class CategoryModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async create(categoryData: CreateCategoryDTO): Promise<Category> {
    const result = await this.pool.query(
      `INSERT INTO categories 
       (name, description, image_url, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        categoryData.name, 
        categoryData.description || null, 
        categoryData.image_url || null,
        categoryData.is_active !== undefined ? categoryData.is_active : true,
        categoryData.sort_order || 0
      ]
    );

    return result.rows[0];
  }

  async findById(id: number): Promise<Category | null> {
    const result = await this.pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findAll(activeOnly: boolean = false): Promise<Category[]> {
    let query = 'SELECT * FROM categories';
    
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    
    query += ' ORDER BY sort_order ASC, name ASC';
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async update(id: number, categoryData: UpdateCategoryDTO): Promise<Category | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (categoryData.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(categoryData.name);
      paramCount++;
    }

    if (categoryData.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(categoryData.description);
      paramCount++;
    }

    if (categoryData.image_url !== undefined) {
      updates.push(`image_url = $${paramCount}`);
      values.push(categoryData.image_url);
      paramCount++;
    }

    if (categoryData.is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(categoryData.is_active);
      paramCount++;
    }

    if (categoryData.sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount}`);
      values.push(categoryData.sort_order);
      paramCount++;
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE categories 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default new CategoryModel(); 