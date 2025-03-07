import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth";
import { storage } from "../storage";
import { createTeamsRouter } from "./teams";
import { createPlayersRouter } from "./players";
import { createAttendanceRouter } from "./attendance";
import { createPracticeNotesRouter } from "./practice-notes";
import { createPaymentsRouter } from "./payments";
import { createTeamMembersRouter } from "./team-members";
import { createUserRouter } from "./user";
import { RouteRegistry } from "../utils/RouteRegistry";

/**
 * Register all API routes for the application
 * 
 * This function sets up authentication and registers all API endpoints
 * for teams, players, attendance, practice notes, and payments.
 * 
 * The API follows these general authorization patterns:
 * - Coaches can access and modify data for teams they coach
 * - Parents can access data for teams their children are on
 * - Some operations (like creating teams) are restricted to coaches only
 * 
 * @param app - Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Initialize route registry
  const registry = new RouteRegistry();

  // Add debug endpoint for session and auth
  app.get("/api/debug/auth", (req, res) => {
    console.log("[DEBUG] Auth check endpoint called");
    console.log("[DEBUG] Session:", JSON.stringify(req.session));
    console.log("[DEBUG] isAuthenticated:", req.isAuthenticated());
    console.log("[DEBUG] User:", req.user);
    
    // Use type assertion to avoid linter errors
    const sessionData = req.session as any;
    
    res.json({
      isAuthenticated: req.isAuthenticated(),
      sessionData: {
        id: req.session.id,
        cookie: req.session.cookie,
        passport: sessionData.passport,
        userId: sessionData.userId
      },
      user: req.user
    });
  });

  // Register routes
  const teamMembersRouter = createTeamMembersRouter(storage);
  
  // Register the team members route with its standalone GET /api/user/teams endpoint
  app.use(teamMembersRouter);
  
  // Register the user router for profile management
  const userRouter = createUserRouter(storage);
  app.use("/api/user", userRouter);
  
  // Register other routes
  app.use("/api/teams", createTeamsRouter(storage));
  app.use("/api/teams/:teamId/players", createPlayersRouter(storage));
  app.use("/api/teams/:teamId/attendance", createAttendanceRouter(storage));
  app.use("/api/teams/:teamId/practice-notes", createPracticeNotesRouter(storage));
  app.use("/api/teams/:teamId/payments", createPaymentsRouter(storage));

  // Add a catch-all handler for API routes to return proper errors for unknown endpoints
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `API endpoint not found: ${req.method} ${req.path}`
    });
  });

  // Scan for duplicate routes after all routes are registered
  registry.scanExpress(app);
  
  // Log all registered routes in development
  if (process.env.NODE_ENV === 'development') {
    console.log('\nRegistered Routes:');
    registry.getRoutes().sort().forEach(route => {
      console.log(`  ${route}`);
    });
    console.log();
  }

  // Create and return HTTP server
  return createServer(app);
} 