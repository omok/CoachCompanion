// Load environment variables from .env file
import path from "path";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { requestLogger } from "./middleware/request-logger";
import { LoggerService } from "./services/logger-service";

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Serve static files from the client/dist directory
app.use(express.static("client/dist"));

// Add request logger middleware to log all API requests to the database
app.use(requestLogger());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  interface HttpError extends Error {
    code?: string;
  }
  app.use(
    (
      err: HttpError,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      // Log the error to the database
      LoggerService.logError(
        req.user?.id,
        req.path,
        err,
        {
          method: req.method,
          query: req.query,
          body: req.body,
          ip: req.ip
        }
      );

      console.error("Error:", err);

      // Handle CSRF token errors
      if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({
          error:
            "CSRF token validation failed. Please refresh the page and try again.",
        });
      }

      // Handle other errors
      res.status(500).json({
        error:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err.message || "Unknown error",
      });
    },
  );

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`serving on port ${port}`);
  });
})();
