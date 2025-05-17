import { Pool } from 'pg';
import db from '../config/database';

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  supplier_id?: number;
  supplier_name?: string;
  is_active: boolean;
  last_restock_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInventoryItemDTO {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  supplier_id?: number;
  supplier_name?: string;
  is_active?: boolean;
}

export interface UpdateInventoryItemDTO {
  name?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  min_quantity?: number;
  cost_price?: number;
  supplier_id?: number;
  supplier_name?: string;
  is_active?: boolean;
  last_restock_date?: Date;
}

export interface InventoryTransaction {
  id: number;
  inventory_item_id: number;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'loss';
  quantity: number;
  previous_quantity: number;
  current_quantity: number;
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
  user_id: number;
  created_at: Date;
}

export interface CreateInventoryTransactionDTO {
  inventory_item_id: number;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'loss';
  quantity: number;
  unit_cost?: number;
  notes?: string;
}

class InventoryModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async createItem(itemData: CreateInventoryItemDTO): Promise<InventoryItem> {
    const result = await this.pool.query(
      `INSERT INTO inventory_items 
       (name, category, unit, quantity, min_quantity, cost_price, supplier_id, supplier_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        itemData.name,
        itemData.category,
        itemData.unit,
        itemData.quantity,
        itemData.min_quantity,
        itemData.cost_price,
        itemData.supplier_id || null,
        itemData.supplier_name || null,
        itemData.is_active !== undefined ? itemData.is_active : true
      ]
    );

    return result.rows[0];
  }

  async findItemById(id: number): Promise<InventoryItem | null> {
    const result = await this.pool.query(
      'SELECT * FROM inventory_items WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findAllItems(category?: string, lowStock: boolean = false): Promise<InventoryItem[]> {
    let query = 'SELECT *, quantity::float / NULLIF(min_quantity, 0) as stock_ratio FROM inventory_items';
    const queryParams: any[] = [];
    let paramCount = 1;
    
    if (category) {
      query += ` WHERE category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }
    
    if (lowStock) {
      if (paramCount === 1) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      query += ` quantity <= min_quantity AND is_active = TRUE`;
    }
    
    query += ' ORDER BY CASE WHEN quantity <= min_quantity THEN 0 ELSE 1 END, quantity::float / NULLIF(min_quantity, 0) ASC, category ASC, name ASC';
    
    const result = await this.pool.query(query, queryParams);
    return result.rows;
  }

  async updateItem(id: number, itemData: UpdateInventoryItemDTO): Promise<InventoryItem | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (itemData.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(itemData.name);
      paramCount++;
    }

    if (itemData.category !== undefined) {
      updates.push(`category = $${paramCount}`);
      values.push(itemData.category);
      paramCount++;
    }

    if (itemData.unit !== undefined) {
      updates.push(`unit = $${paramCount}`);
      values.push(itemData.unit);
      paramCount++;
    }

    if (itemData.quantity !== undefined) {
      updates.push(`quantity = $${paramCount}`);
      values.push(itemData.quantity);
      paramCount++;
    }

    if (itemData.min_quantity !== undefined) {
      updates.push(`min_quantity = $${paramCount}`);
      values.push(itemData.min_quantity);
      paramCount++;
    }

    if (itemData.cost_price !== undefined) {
      updates.push(`cost_price = $${paramCount}`);
      values.push(itemData.cost_price);
      paramCount++;
    }

    if (itemData.supplier_id !== undefined) {
      updates.push(`supplier_id = $${paramCount}`);
      values.push(itemData.supplier_id);
      paramCount++;
    }

    if (itemData.supplier_name !== undefined) {
      updates.push(`supplier_name = $${paramCount}`);
      values.push(itemData.supplier_name);
      paramCount++;
    }

    if (itemData.is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(itemData.is_active);
      paramCount++;
    }

    if (itemData.last_restock_date !== undefined) {
      updates.push(`last_restock_date = $${paramCount}`);
      values.push(itemData.last_restock_date);
      paramCount++;
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE inventory_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async adjustQuantity(id: number, quantity: number, userId: number, notes?: string, transactionType: 'purchase' | 'usage' | 'adjustment' | 'loss' = 'adjustment', unitCost?: number): Promise<InventoryItem | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM update_inventory_quantity($1, $2, $3, $4, $5, $6)',
        [id, quantity, transactionType, userId, unitCost, notes]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Stok güncelleme hatası:', error);
      throw error;
    }
  }
  
  async getTransactions(itemId?: number, transactionType?: string, startDate?: Date, endDate?: Date): Promise<InventoryTransaction[]> {
    let query = 'SELECT * FROM inventory_transactions';
    const queryParams: any[] = [];
    let paramCount = 1;
    let hasWhere = false;
    
    if (itemId) {
      query += ` WHERE inventory_item_id = $${paramCount}`;
      queryParams.push(itemId);
      paramCount++;
      hasWhere = true;
    }
    
    if (transactionType) {
      if (hasWhere) {
        query += ` AND transaction_type = $${paramCount}`;
      } else {
        query += ` WHERE transaction_type = $${paramCount}`;
        hasWhere = true;
      }
      queryParams.push(transactionType);
      paramCount++;
    }
    
    if (startDate) {
      if (hasWhere) {
        query += ` AND created_at >= $${paramCount}`;
      } else {
        query += ` WHERE created_at >= $${paramCount}`;
        hasWhere = true;
      }
      queryParams.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      if (hasWhere) {
        query += ` AND created_at <= $${paramCount}`;
      } else {
        query += ` WHERE created_at <= $${paramCount}`;
      }
      queryParams.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, queryParams);
    return result.rows;
  }
  
  async getItemCategories(): Promise<string[]> {
    const result = await this.pool.query(
      'SELECT DISTINCT category FROM inventory_items ORDER BY category ASC'
    );
    
    return result.rows.map(row => row.category);
  }
  
  async getLowStockItems(): Promise<InventoryItem[]> {
    const result = await this.pool.query(
      'SELECT * FROM inventory_items WHERE quantity <= min_quantity AND is_active = TRUE ORDER BY quantity / min_quantity ASC'
    );
    
    return result.rows;
  }
}

export default new InventoryModel(); 