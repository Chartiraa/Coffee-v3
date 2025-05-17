-- Status alanı için constraint'i güncelle
ALTER TABLE tables 
DROP CONSTRAINT IF EXISTS tables_status_check;

-- Yeni constraint ekleme
ALTER TABLE tables 
ADD CONSTRAINT tables_status_check 
CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance'));

-- Mevcut tüm tables kayıtlarında null status değerlerini varsayılan available olarak ayarla
UPDATE tables SET status = 'available' WHERE status IS NULL;

-- Status alanını NOT NULL yap (eğer değilse)
ALTER TABLE tables 
ALTER COLUMN status SET NOT NULL;

-- Status sütunu için indeks ekle (hızlı arama için)
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- Log tablosu yap
CREATE TABLE IF NOT EXISTS table_status_logs (
  id SERIAL PRIMARY KEY,
  table_id INT NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  user_id INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Trigger function oluştur - masa durumu değiştiğinde kayıt tut
CREATE OR REPLACE FUNCTION log_table_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO table_status_logs (table_id, previous_status, new_status, user_id)
    VALUES (NEW.id, OLD.status, NEW.status, NULL); -- user_id şu anda NULL - session bilgisi olursa eklenebilir
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS table_status_change ON tables;
CREATE TRIGGER table_status_change
AFTER UPDATE ON tables
FOR EACH ROW
EXECUTE FUNCTION log_table_status_change(); 