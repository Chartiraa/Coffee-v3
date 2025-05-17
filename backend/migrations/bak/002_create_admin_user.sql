-- Şifre: admin123 (bcrypt ile hashlenmis hali)
INSERT INTO users (username, password, full_name, role, created_at, updated_at)
VALUES (
  'admin',
  '$2a$10$rJ7.7UBCXrz.VYs1PAO2h.QR8.7KXDSZJHNtNGYqF9tEKDz3.UEfe',
  'System Administrator',
  'admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING; 