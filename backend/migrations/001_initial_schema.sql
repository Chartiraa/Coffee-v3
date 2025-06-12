-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  profile_picture TEXT,
  role VARCHAR(50) CHECK (role IN ('admin', 'manager', 'waiter', 'cashier', 'barista', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ürünler tablosu
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  preparation_time INTEGER DEFAULT 5, -- Dakika cinsinden hazırlık süresi
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ürün seçenekleri tablosu (boyut, sütlü/sütsüz, ekstra şot vs.)
CREATE TABLE IF NOT EXISTS product_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ürün seçenek değerleri
CREATE TABLE IF NOT EXISTS option_values (
  id SERIAL PRIMARY KEY,
  option_id INTEGER REFERENCES product_options(id) ON DELETE CASCADE,
  value VARCHAR(50) NOT NULL,
  price_modifier DECIMAL(10, 2) DEFAULT 0, -- Fiyat farkı, pozitif veya negatif olabilir
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ürünler ve seçenekler arasındaki ilişki tablosu
CREATE TABLE IF NOT EXISTS product_option_relations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES product_options(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, option_id)
); 

-- Masalar tablosu
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  location VARCHAR(100),
  qr_code TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Siparişler tablosu
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

-- Sipariş detayları tablosu
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

-- Stok öğeleri tablosu
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  supplier_id INT,
  supplier_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_restock_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Stok işlemleri tablosu
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  inventory_item_id INT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'loss')),
  quantity DECIMAL(10, 2) NOT NULL,
  previous_quantity DECIMAL(10, 2) NOT NULL,
  current_quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  notes TEXT,
  user_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ödemeler tablosu
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'gift_card', 'mobile')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference_number VARCHAR(100),
  notes TEXT,
  user_id INT NOT NULL,
  discount_amount DECIMAL(10, 2),
  discount_reason TEXT,
  is_complimentary BOOLEAN DEFAULT FALSE,
  complimentary_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Kasa işlemleri tablosu
CREATE TABLE IF NOT EXISTS cash_register_transactions (
  id SERIAL PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('opening', 'closing', 'sale', 'expense', 'deposit', 'withdrawal', 'correction', 'discount', 'complimentary')),
  amount DECIMAL(10, 2) NOT NULL,
  payment_id INT,
  notes TEXT,
  user_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE waiter_calls (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, done, cancelled vs.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Örnek stok kategorileri
INSERT INTO inventory_items (name, category, unit, quantity, min_quantity, cost_price, is_active) VALUES
  ('Arabica Çekirdek Kahve', 'Kahve Çekirdeği', 'kg', 10.00, 2.00, 150.00, true),
  ('Robusta Çekirdek Kahve', 'Kahve Çekirdeği', 'kg', 8.00, 2.00, 120.00, true),
  ('Türk Kahvesi', 'Kahve', 'kg', 5.00, 1.00, 80.00, true),
  ('Filtre Kahve Çekirdeği', 'Kahve Çekirdeği', 'kg', 7.00, 1.50, 140.00, true),
  ('Tam Yağlı Süt', 'Süt Ürünleri', 'lt', 20.00, 5.00, 15.00, true),
  ('Laktozsuz Süt', 'Süt Ürünleri', 'lt', 10.00, 3.00, 20.00, true),
  ('Badem Sütü', 'Süt Ürünleri', 'lt', 8.00, 2.00, 25.00, true),
  ('Soya Sütü', 'Süt Ürünleri', 'lt', 8.00, 2.00, 22.00, true),
  ('Beyaz Şeker', 'Şeker', 'kg', 10.00, 2.00, 20.00, true),
  ('Esmer Şeker', 'Şeker', 'kg', 5.00, 1.00, 25.00, true),
  ('Çay', 'Çay', 'kg', 5.00, 1.00, 60.00, true),
  ('Bitki Çayı - Nane', 'Çay', 'kg', 2.00, 0.50, 70.00, true),
  ('Bitki Çayı - Papatya', 'Çay', 'kg', 2.00, 0.50, 70.00, true),
  ('Kakaolu Milkshake Tozu', 'Tatlı', 'kg', 3.00, 0.70, 50.00, true),
  ('Çikolata Sosu', 'Tatlı', 'lt', 5.00, 1.00, 40.00, true),
  ('Karamel Sosu', 'Tatlı', 'lt', 5.00, 1.00, 40.00, true),
  ('Vanilya Şurubu', 'Şurup', 'lt', 4.00, 1.00, 45.00, true),
  ('Çikolata Şurubu', 'Şurup', 'lt', 4.00, 1.00, 45.00, true),
  ('Karamel Şurubu', 'Şurup', 'lt', 4.00, 1.00, 45.00, true),
  ('Büyük Boy Bardak', 'Ambalaj', 'adet', 500.00, 100.00, 1.50, true),
  ('Orta Boy Bardak', 'Ambalaj', 'adet', 500.00, 100.00, 1.00, true),
  ('Küçük Boy Bardak', 'Ambalaj', 'adet', 500.00, 100.00, 0.80, true),
  ('Türk Kahvesi Fincanı', 'Ambalaj', 'adet', 50.00, 10.00, 5.00, true),
  ('Kağıt Peçete', 'Ambalaj', 'paket', 50.00, 10.00, 10.00, true),
  ('Karıştırıcı', 'Ambalaj', 'adet', 1000.00, 200.00, 0.10, true);

-- İndeksler
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_cash_register_type ON cash_register_transactions(transaction_type);
CREATE INDEX idx_cash_register_created_at ON cash_register_transactions(created_at); 

-- İndeksler
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id); 