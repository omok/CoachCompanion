import { Express, Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';

/**
 * Sets up CSRF protection for the application
 * 
 * This function configures CSRF protection using the csrf-csrf package.
 * It sets up middleware to generate and validate CSRF tokens, and
 * creates an endpoint to get a new CSRF token.
 * 
 * @param app - Express application instance
 */
export function setupCsrf(app: Express) {
  // Environment variables for configuration
  const isProd = process.env.NODE_ENV === 'production';
  
  // CSRF protection configuration
  const { generateToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.SESSION_SECRET || 'default-csrf-secret',
    cookieName: 'x-csrf-token',
    cookieOptions: {
      httpOnly: true,
      sameSite: isProd ? 'strict' : 'lax',
      secure: isProd,
      path: '/',
    },
    size: 64, // Token size
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods that don't require CSRF protection
  });

  // Apply CSRF protection middleware to all routes
  app.use(doubleCsrfProtection);

  // Expose route to get a CSRF token
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    res.json({ csrfToken: generateToken(req, res) });
  });

  // Handle CSRF errors
  interface CsrfError extends Error {
    code?: string;
  }
  app.use((err: CsrfError, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'CSRF_INVALID') {
      return res.status(403).json({
        error: 'CSRF token validation failed. Please refresh the page and try again.'
      });
    }
    next(err);
  });
} 