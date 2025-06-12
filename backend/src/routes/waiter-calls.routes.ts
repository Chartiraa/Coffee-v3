import { Router } from 'express';
import pool from '../config/database';
import { socketService } from '../index';

const router = Router();

// Garson çağırma kaydı oluştur
router.post('/', async (req, res) => {
  const { table_id } = req.body;
  if (!table_id) return res.status(400).json({ error: 'table_id zorunlu' });
  try {
    const result = await pool.query(
      'INSERT INTO waiter_calls (table_id, status) VALUES ($1, $2) RETURNING *',
      [table_id, 'pending']
    );
    
    // Socket.IO bildirimi gönder
    socketService.emitNewWaiterCall(result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  }
});

// Aktif çağrıları listele
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM waiter_calls WHERE status = $1 ORDER BY created_at DESC',
      ['pending']
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  }
});

// Çağrıyı kapat/güncelle
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE waiter_calls SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    // Socket.IO bildirimi gönder
    socketService.emitWaiterCallUpdate(result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  }
});

export default router; 