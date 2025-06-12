import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import AuthController from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

// Debug için route'ları logla
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] Auth Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
  // redirect_uri'yi query parametresi olarak sakla
  const redirectUri = req.query.redirect_uri;
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  AuthController.googleCallback as RequestHandler
);

// Protected routes
router.get('/profile', authenticate as RequestHandler, AuthController.getProfile as RequestHandler);
router.get('/pending-users', authenticate as RequestHandler, AuthController.listPendingUsers as RequestHandler);
router.get('/users', authenticate as RequestHandler, AuthController.listAllUsers as RequestHandler);
router.post('/update-role', authenticate as RequestHandler, AuthController.updateUserRole as RequestHandler);
router.delete('/users/:id', authenticate as RequestHandler, AuthController.deleteUser as RequestHandler);

export default router; 