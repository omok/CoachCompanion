/**
 * Logger Service
 * 
 * Provides a centralized service for logging application events to both
 * the console and the database. This service can be used directly in 
 * routes and other services when manual logging is needed.
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { usageLogs } from '@shared/schema';
import { Logger } from '../logger';
import { sql } from 'drizzle-orm';

export interface LogEntry {
  userId?: number | null;
  action: string;
  endpoint: string;
  statusCode?: number | null;
  responseTime?: number | null;
  errorMessage?: string | null;
  additionalData?: any;
}

export class LoggerService {
  /**
   * Log an application event to both console and database
   */
  static async logEvent(entry: LogEntry): Promise<void> {
    try {
      const logId = uuidv4();
      
      // Ensure userId is properly handled
      // If userId is undefined, explicitly set it to null for the database
      const userIdForDb = entry.userId !== undefined ? entry.userId : null;
            
      // Use raw SQL to insert the log with explicit type casting for userId
      if (userIdForDb !== null) {
        // Insert with userId
        await db.execute(sql`
          INSERT INTO usage_logs (
            id, user_id, timestamp, action, endpoint, 
            status_code, response_time, error_message, additional_data
          ) VALUES (
            ${logId}, ${Number(userIdForDb)}::integer, ${new Date()}, ${entry.action}, ${entry.endpoint},
            ${entry.statusCode || null}, ${entry.responseTime || null}, ${entry.errorMessage || null}, 
            ${entry.additionalData ? JSON.stringify(entry.additionalData) : null}
          )
        `);
      } else {
        // Insert without userId (will be NULL)
        await db.execute(sql`
          INSERT INTO usage_logs (
            id, timestamp, action, endpoint, 
            status_code, response_time, error_message, additional_data
          ) VALUES (
            ${logId}, ${new Date()}, ${entry.action}, ${entry.endpoint},
            ${entry.statusCode || null}, ${entry.responseTime || null}, ${entry.errorMessage || null}, 
            ${entry.additionalData ? JSON.stringify(entry.additionalData) : null}
          )
        `);
      }
      
      // Also log to console
      if (entry.errorMessage) {
        Logger.error(`${entry.action} ${entry.endpoint} ${entry.statusCode || ''} ${entry.errorMessage}`, {
          userId: entry.userId,
          ...entry.additionalData
        });
      } else {
        Logger.info(`${entry.action} ${entry.endpoint} ${entry.statusCode || ''}`, {
          userId: entry.userId,
          responseTime: entry.responseTime,
          ...entry.additionalData
        });
      }
    } catch (error) {
      // If database logging fails, at least log to console
      Logger.error('Failed to log event to database', error);
      console.error('Database logging error:', error);
      
      // Log the detailed error for debugging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  }
  
  /**
   * Log an API request
   */
  static async logApiRequest(
    userId: number | null | undefined,
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    errorMessage?: string | null,
    additionalData?: any
  ): Promise<void> {
    return this.logEvent({
      userId,
      action: method,
      endpoint,
      statusCode,
      responseTime,
      errorMessage,
      additionalData
    });
  }
  
  /**
   * Log an error
   */
  static async logError(
    userId: number | null | undefined,
    endpoint: string,
    error: Error | string,
    additionalData?: any
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return this.logEvent({
      userId,
      action: 'ERROR',
      endpoint,
      errorMessage,
      additionalData
    });
  }
  
  /**
   * Log a custom application event
   */
  static async logCustomEvent(
    userId: number | null | undefined,
    action: string,
    details: string,
    additionalData?: any
  ): Promise<void> {
    return this.logEvent({
      userId,
      action,
      endpoint: 'custom',
      additionalData: {
        ...additionalData,
        details
      }
    });
  }
  
  /**
   * Log a security event (login, logout, permission change, etc.)
   */
  static async logSecurityEvent(
    userId: number | null | undefined,
    action: string,
    details: string,
    additionalData?: any
  ): Promise<void> {
    return this.logEvent({
      userId,
      action: `SECURITY:${action}`,
      endpoint: 'security',
      additionalData: {
        ...additionalData,
        details
      }
    });
  }
}
