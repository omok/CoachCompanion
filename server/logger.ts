/**
 * Simple logger utility for server-side logging
 */
export class Logger {
  static debug(message: string, data?: unknown): void {
    console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, data || '');
  }

  static info(message: string, data?: unknown): void {
    console.info(`[${new Date().toISOString()}] INFO: ${message}`, data || '');
  }

  static warn(message: string, data?: unknown): void {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, data || '');
  }

  static error(message: string, data?: unknown): void {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, data || '');
  }
} 