import { Pool } from 'pg';
import db from '../config/database';

export interface ProductOption {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OptionValue {
  id: number;
  option_id: number;
  value: string;
  price_modifier: number;
  is_default: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductOptionWithValues extends ProductOption {
  values: OptionValue[];
}

export interface CreateProductOptionDTO {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateProductOptionDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateOptionValueDTO {
  option_id: number;
  value: string;
  price_modifier?: number;
  is_default?: boolean;
  sort_order?: number;
}

export interface UpdateOptionValueDTO {
  value?: string;
  price_modifier?: number;
  is_default?: boolean;
  sort_order?: number;
}

export interface ProductOptionRelation {
  id: number;
  product_id: number;
  option_id: number;
  is_required: boolean;
  created_at: Date;
}

export interface CreateProductOptionRelationDTO {
  product_id: number;
  option_id: number;
  is_required?: boolean;
}

class ProductOptionModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  // Ürün seçenekleri (options) için CRUD işlemleri
  async createOption(optionData: CreateProductOptionDTO): Promise<ProductOption> {
    const result = await this.pool.query(
      `INSERT INTO product_options 
       (name, description, is_active)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        optionData.name,
        optionData.description || null,
        optionData.is_active !== undefined ? optionData.is_active : true
      ]
    );

    return result.rows[0];
  }

  async findOptionById(id: number): Promise<ProductOption | null> {
    const result = await this.pool.query(
      'SELECT * FROM product_options WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findAllOptions(activeOnly: boolean = false): Promise<ProductOption[]> {
    let query = 'SELECT * FROM product_options';
    
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async updateOption(id: number, optionData: UpdateProductOptionDTO): Promise<ProductOption | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (optionData.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(optionData.name);
      paramCount++;
    }

    if (optionData.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(optionData.description);
      paramCount++;
    }

    if (optionData.is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(optionData.is_active);
      paramCount++;
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE product_options 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteOption(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM product_options WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Seçenek değerleri (option values) için CRUD işlemleri
  async createOptionValue(valueData: CreateOptionValueDTO): Promise<OptionValue> {
    const result = await this.pool.query(
      `INSERT INTO option_values 
       (option_id, value, price_modifier, is_default, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        valueData.option_id,
        valueData.value,
        valueData.price_modifier || 0,
        valueData.is_default !== undefined ? valueData.is_default : false,
        valueData.sort_order || 0
      ]
    );

    return result.rows[0];
  }

  async findOptionValueById(id: number): Promise<OptionValue | null> {
    const result = await this.pool.query(
      'SELECT * FROM option_values WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findOptionValuesByOptionId(optionId: number): Promise<OptionValue[]> {
    const result = await this.pool.query(
      'SELECT * FROM option_values WHERE option_id = $1 ORDER BY sort_order ASC, value ASC',
      [optionId]
    );

    return result.rows;
  }

  async updateOptionValue(id: number, valueData: UpdateOptionValueDTO): Promise<OptionValue | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (valueData.value !== undefined) {
      updates.push(`value = $${paramCount}`);
      values.push(valueData.value);
      paramCount++;
    }

    if (valueData.price_modifier !== undefined) {
      updates.push(`price_modifier = $${paramCount}`);
      values.push(valueData.price_modifier);
      paramCount++;
    }

    if (valueData.is_default !== undefined) {
      updates.push(`is_default = $${paramCount}`);
      values.push(valueData.is_default);
      paramCount++;
    }

    if (valueData.sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount}`);
      values.push(valueData.sort_order);
      paramCount++;
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE option_values 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteOptionValue(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM option_values WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Ürün-seçenek ilişkileri için CRUD işlemleri
  async createProductOptionRelation(relationData: CreateProductOptionRelationDTO): Promise<ProductOptionRelation> {
    const result = await this.pool.query(
      `INSERT INTO product_option_relations 
       (product_id, option_id, is_required)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        relationData.product_id,
        relationData.option_id,
        relationData.is_required !== undefined ? relationData.is_required : false
      ]
    );

    return result.rows[0];
  }

  async findProductOptionRelationsByProductId(productId: number): Promise<ProductOptionRelation[]> {
    const result = await this.pool.query(
      'SELECT * FROM product_option_relations WHERE product_id = $1',
      [productId]
    );

    return result.rows;
  }

  async findProductOptionsWithValuesByProductId(productId: number): Promise<ProductOptionWithValues[]> {
    const relations = await this.findProductOptionRelationsByProductId(productId);
    
    if (relations.length === 0) {
      return [];
    }

    const optionIds = relations.map(relation => relation.option_id);
    const optionsQuery = await this.pool.query(
      'SELECT * FROM product_options WHERE id = ANY($1)',
      [optionIds]
    );

    const options = optionsQuery.rows;
    const result: ProductOptionWithValues[] = [];

    for (const option of options) {
      const values = await this.findOptionValuesByOptionId(option.id);
      const relation = relations.find(r => r.option_id === option.id);
      
      result.push({
        ...option,
        is_required: relation ? relation.is_required : false,
        values
      });
    }

    return result;
  }

  async deleteProductOptionRelation(productId: number, optionId: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM product_option_relations WHERE product_id = $1 AND option_id = $2 RETURNING id',
      [productId, optionId]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default new ProductOptionModel(); 