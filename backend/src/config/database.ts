import { Pool } from 'pg';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Bağlantıyı test et
pool.connect((err, client, release) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
    return;
  }
  console.log('PostgreSQL veritabanına başarıyla bağlanıldı');
  release();
});

export default pool; 