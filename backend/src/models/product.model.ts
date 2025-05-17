import { Pool } from 'pg';
import db from '../config/database';
import { Category } from './category.model';

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  preparation_time: number;
  is_available: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithCategory extends Product {
  category: Category;
}

export interface CreateProductDTO {
  category_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_active?: boolean;
  preparation_time?: number;
  is_available?: boolean;
  sort_order?: number;
}

export interface UpdateProductDTO {
  category_id?: number;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_active?: boolean;
  preparation_time?: number;
  is_available?: boolean;
  sort_order?: number;
}

class ProductModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async create(productData: CreateProductDTO): Promise<Product> {
    const result = await this.pool.query(
      `INSERT INTO products 
       (category_id, name, description, price, image_url, is_active, preparation_time, is_available, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        productData.category_id,
        productData.name,
        productData.description || null,
        productData.price,
        productData.image_url || null,
        productData.is_active !== undefined ? productData.is_active : true,
        productData.preparation_time || 5,
        productData.is_available !== undefined ? productData.is_available : true,
        productData.sort_order || 0
      ]
    );

    return result.rows[0];
  }

  async findById(id: number): Promise<Product | null> {
    const result = await this.pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findWithCategory(id: number): Promise<ProductWithCategory | null> {
    const result = await this.pool.query(
      `SELECT p.*, c.name as category_name, c.description as category_description, 
              c.image_url as category_image_url, c.is_active as category_is_active
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (!result.rows[0]) return null;

    const product = result.rows[0];
    return {
      ...product,
      category: {
        id: product.category_id,
        name: product.category_name,
        description: product.category_description,
        image_url: product.category_image_url,
        is_active: product.category_is_active,
        sort_order: product.category_sort_order,
        created_at: product.category_created_at,
        updated_at: product.category_updated_at
      }
    };
  }

  async findAll(
    activeOnly: boolean = false,
    availableOnly: boolean = false,
    categoryId?: number
  ): Promise<Product[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (activeOnly) {
      conditions.push(`is_active = TRUE`);
    }

    if (availableOnly) {
      conditions.push(`is_available = TRUE`);
    }

    if (categoryId) {
      conditions.push(`category_id = $${paramCount}`);
      values.push(categoryId);
      paramCount++;
    }

    let query = 'SELECT * FROM products';
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY sort_order ASC, name ASC';
    
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async findAllWithCategory(
    activeOnly: boolean = false,
    availableOnly: boolean = false,
    categoryId?: number
  ): Promise<ProductWithCategory[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (activeOnly) {
      conditions.push(`p.is_active = TRUE`);
    }

    if (availableOnly) {
      conditions.push(`p.is_available = TRUE`);
    }

    if (categoryId) {
      conditions.push(`p.category_id = $${paramCount}`);
      values.push(categoryId);
      paramCount++;
    }

    let query = `
      SELECT p.*, c.name as category_name, c.description as category_description, 
             c.image_url as category_image_url, c.is_active as category_is_active,
             c.sort_order as category_sort_order, c.created_at as category_created_at,
             c.updated_at as category_updated_at
      FROM products p
      JOIN categories c ON p.category_id = c.id`;
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY p.sort_order ASC, p.name ASC';
    
    const result = await this.pool.query(query, values);
    
    return result.rows.map(row => ({
      ...row,
      category: {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description,
        image_url: row.category_image_url,
        is_active: row.category_is_active,
        sort_order: row.category_sort_order,
        created_at: row.category_created_at,
        updated_at: row.category_updated_at
      }
    }));
  }

  async update(id: number, productData: UpdateProductDTO): Promise<Product | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (productData.category_id !== undefined) {
      updates.push(`category_id = $${paramCount}`);
      values.push(productData.category_id);
      paramCount++;
    }

    if (productData.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(productData.name);
      paramCount++;
    }

    if (productData.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(productData.description);
      paramCount++;
    }

    if (productData.price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(productData.price);
      paramCount++;
    }

    if (productData.image_url !== undefined) {
      updates.push(`image_url = $${paramCount}`);
      values.push(productData.image_url);
      paramCount++;
    }

    if (productData.is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(productData.is_active);
      paramCount++;
    }

    if (productData.preparation_time !== undefined) {
      updates.push(`preparation_time = $${paramCount}`);
      values.push(productData.preparation_time);
      paramCount++;
    }

    if (productData.is_available !== undefined) {
      updates.push(`is_available = $${paramCount}`);
      values.push(productData.is_available);
      paramCount++;
    }

    if (productData.sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount}`);
      values.push(productData.sort_order);
      paramCount++;
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE products 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateAvailability(id: number, isAvailable: boolean): Promise<Product | null> {
    const result = await this.pool.query(
      `UPDATE products 
       SET is_available = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [isAvailable, id]
    );

    return result.rows[0] || null;
  }
}

export default new ProductModel(); 