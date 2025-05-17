-- Masa ödeme tablosu - masayla ilişkili tüm ödemeleri toplar
CREATE TABLE IF NOT EXISTS table_payments (
  id SERIAL PRIMARY KEY,
  table_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'closed', 'cancelled')),
  user_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sipariş öğesi ödeme tablosu - hangi sipariş öğesinin ne kadarının ödendiğini takip eder
CREATE TABLE IF NOT EXISTS order_item_payments (
  id SERIAL PRIMARY KEY,
  order_item_id INT NOT NULL,
  payment_id INT NOT NULL,
  paid_quantity INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- Payments tablosuna table_payment_id alanı ekleme
ALTER TABLE payments ADD COLUMN table_payment_id INT;
ALTER TABLE payments ADD FOREIGN KEY (table_payment_id) REFERENCES table_payments(id);

-- Payments tablosunda order_id sütununu NULL değer kabul edecek şekilde değiştir
ALTER TABLE payments ALTER COLUMN order_id DROP NOT NULL;

-- Eklenecek prosedür - bir masanın toplam, ödenen ve kalan tutarını hesaplar
CREATE OR REPLACE FUNCTION update_table_payment_amounts(p_table_payment_id INT)
RETURNS void AS $$
DECLARE
  v_total DECIMAL(10, 2);
  v_paid DECIMAL(10, 2);
  v_remaining DECIMAL(10, 2);
BEGIN
  -- Toplam tutarı hesapla (masaya ait sadece aktif ve ödenmemiş siparişlerin toplamı)
  SELECT COALESCE(SUM(o.total_amount), 0) INTO v_total
  FROM orders o
  WHERE o.table_id = (SELECT table_id FROM table_payments WHERE id = p_table_payment_id)
  AND o.status NOT IN ('cancelled', 'completed');
  
  -- Ödenen tutarı hesapla
  SELECT COALESCE(SUM(p.amount), 0) INTO v_paid
  FROM payments p
  WHERE p.table_payment_id = p_table_payment_id
  AND p.status = 'completed';
  
  -- Kalan tutarı hesapla
  v_remaining := v_total - v_paid;
  
  -- Table payment kaydını güncelle
  UPDATE table_payments
  SET total_amount = v_total,
      paid_amount = v_paid,
      remaining_amount = v_remaining,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_table_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Eklenecek trigger - sipariş tutarı değiştiğinde ilgili masa ödemesini günceller
CREATE OR REPLACE FUNCTION update_table_payment_on_order_change()
RETURNS TRIGGER AS $$
DECLARE
  v_table_payment_id INT;
BEGIN
  -- Sipariş güncellendi veya eklendi
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- İlgili masanın aktif table_payment kaydını bul
    SELECT id INTO v_table_payment_id 
    FROM table_payments
    WHERE table_id = NEW.table_id AND status = 'active'
    LIMIT 1;
    
    -- Eğer aktif bir tablo ödeme kaydı yoksa, oluştur
    IF v_table_payment_id IS NULL THEN
      INSERT INTO table_payments (table_id, status, user_id)
      VALUES (NEW.table_id, 'active', NEW.user_id)
      RETURNING id INTO v_table_payment_id;
    END IF;
    
    -- Tutarları güncelle
    PERFORM update_table_payment_amounts(v_table_payment_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
CREATE TRIGGER orders_after_insert_update
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_table_payment_on_order_change();

-- İndeksler
CREATE INDEX idx_table_payments_table_id ON table_payments(table_id);
CREATE INDEX idx_table_payments_status ON table_payments(status);
CREATE INDEX idx_order_item_payments_order_item_id ON order_item_payments(order_item_id);
CREATE INDEX idx_order_item_payments_payment_id ON order_item_payments(payment_id); 