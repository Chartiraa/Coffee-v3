import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/app';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { createServer } from 'http';
import SocketService from './services/socket.service';

// Passport konfigürasyonunu yükle
import './config/passport';

// Routes
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import tableRoutes from './routes/table.routes';
import orderRoutes from './routes/order.routes';
import inventoryRoutes from './routes/inventory.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();
const httpServer = createServer(app);

// Socket.IO servisi başlat
export const socketService = new SocketService(httpServer);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(config.cors));
app.use(helmet());
app.use(morgan('dev'));
// Passport middleware
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// Debug için tüm routeları logla
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/tables', tableRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Coffee v3 API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Bir şeyler ters gitti!' });
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`Server ${config.port} portunda çalışıyor`);
  console.log('API Endpoint: http://localhost:' + config.port + '/api/v1');
}); 