-- Masa tablosu
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  location VARCHAR(100),
  qr_code TEXT,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sipariş tablosu
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_id INT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('created', 'in_progress', 'ready', 'delivered', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sipariş öğeleri tablosu
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sipariş öğesi seçenekleri tablosu
CREATE TABLE IF NOT EXISTS order_item_options (
  id SERIAL PRIMARY KEY,
  order_item_id INT NOT NULL,
  option_id INT NOT NULL,
  option_value_id INT NOT NULL,
  option_name VARCHAR(100) NOT NULL,
  option_value VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES product_options(id),
  FOREIGN KEY (option_value_id) REFERENCES option_values(id)
);

-- Örnek veriler
INSERT INTO tables (name, capacity, location) VALUES
  ('Masa 1', 2, 'İç Mekan'),
  ('Masa 2', 4, 'İç Mekan'),
  ('Masa 3', 4, 'İç Mekan'),
  ('Masa 4', 6, 'İç Mekan'),
  ('Masa 5', 2, 'Bahçe'),
  ('Masa 6', 4, 'Bahçe'),
  ('Masa 7', 6, 'Bahçe'),
  ('Masa 8', 8, 'Teras'),
  ('Masa 9', 2, 'Teras'),
  ('Masa 10', 4, 'Teras');

-- Sipariş durumu için indeks
CREATE INDEX idx_orders_status ON orders(status);

-- Masa siparişleri için indeks
CREATE INDEX idx_orders_table_id ON orders(table_id);

-- Kullanıcı siparişleri için indeks
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Sipariş oluşturma tarihine göre indeks
CREATE INDEX idx_orders_created_at ON orders(created_at); 