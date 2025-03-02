/**
 * Simple logger utility for server-side logging
 */
export class Logger {
  static debug(message: string, data?: any): void {
    console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, data || '');
  }

  static info(message: string, data?: any): void {
    console.info(`[${new Date().toISOString()}] INFO: ${message}`, data || '');
  }

  static warn(message: string, data?: any): void {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, data || '');
  }

  static error(message: string, data?: any): void {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, data || '');
  }
} 