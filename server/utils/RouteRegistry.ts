import type { Express } from "express";

/**
 * A simple registry to track and detect duplicate routes in Express
 */
export class RouteRegistry {
  private routes: Set<string> = new Set();

  /**
   * Register a route and check for duplicates
   * @param method HTTP method
   * @param path Route path
   * @returns true if route is new, false if duplicate
   */
  registerRoute(method: string, path: string): boolean {
    const route = `${method.toUpperCase()} ${path}`;
    if (this.routes.has(route)) {
      console.warn(`[WARNING] Duplicate route detected: ${route}`);
      return false;
    }
    this.routes.add(route);
    return true;
  }

  /**
   * Scan an Express app for routes and detect duplicates
   * @param app Express application instance
   */
  scanExpress(app: Express): void {
    const stack = (app._router?.stack || []) as any[];
    
    stack.forEach(layer => {
      if (layer.route) {
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods);
        
        methods.forEach(method => {
          this.registerRoute(method, path);
        });
      }
    });
  }

  /**
   * Get all registered routes
   */
  getRoutes(): string[] {
    return Array.from(this.routes);
  }
} 