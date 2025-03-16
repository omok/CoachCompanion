/**
 * Request Logger Middleware
 * 
 * This middleware logs all API requests to the database for analytics and debugging.
 * It captures request details, response status, timing, and errors.
 */

import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';
import { LoggerService } from '../services/logger-service';

// Use the Express User interface that's already defined in auth.ts
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    session?: any;
  }
}

export const requestLogger = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for non-API routes or static assets
    if (!req.path.startsWith('/api')) {
      return next();
    }

    const startTime = Date.now();
    const requestMethod = req.method;
    const endpoint = req.path;
    
    // Get user ID from session first, then fallback to user object
    let userId: number | null = null;
    
    // Check session first as we're now always syncing user ID to session
    if (req.session && req.session.userId) {
      userId = Number(req.session.userId);
    }
    // Then try authenticated user as fallback
    else if (req.user && req.user.id) {
      userId = Number(req.user.id);
    }
    
    // Store original methods to intercept and capture response data
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseBody: any = null;
    let errorMessage: string | null = null;
    let capturedUserId: number | null = null;
    
    // Override res.json to capture the response body
    res.json = function(body: any) {
      responseBody = body;
      
      // For login/register endpoints, try to extract user ID from response
      if ((endpoint === '/api/login' || endpoint === '/api/register') && body && body.id) {
        capturedUserId = Number(body.id);
      }
      
      return originalJson.apply(res, [body] as any);
    };
    
    // Override res.send to capture the response body
    res.send = function(body: any) {
      if (typeof body === 'object') {
        responseBody = body;
        
        // For login/register endpoints, try to extract user ID from response
        if ((endpoint === '/api/login' || endpoint === '/api/register') && body && body.id) {
          capturedUserId = Number(body.id);
        }
      }
      return originalSend.apply(res, [body] as any);
    };
    
    // Process the request
    res.on('finish', async () => {
      try {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Use captured user ID if available (for login/register)
        if (capturedUserId) {
          userId = capturedUserId;
        }
        
        // Check one more time for userId in session (might have been set during request processing)
        if (!userId && req.session && req.session.userId) {
          userId = Number(req.session.userId);
        }
        
        // Determine if this was an error response
        if (statusCode >= 400) {
          errorMessage = responseBody?.error || `Error with status code ${statusCode}`;
        }
        
        // Prepare additional data to log
        const additionalData = {
          query: req.query,
          // Don't log sensitive information like passwords
          body: sanitizeRequestBody(req.body),
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.socket.remoteAddress
        };
        
        // Delegate to LoggerService for the actual logging
        await LoggerService.logApiRequest(
          userId,
          requestMethod,
          endpoint,
          statusCode,
          responseTime,
          errorMessage,
          additionalData
        );
      } catch (error) {
        // If logging fails, don't crash the app, just log the error to console
        console.error('Failed to log request:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
    });
    
    next();
  };
};

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'key'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
