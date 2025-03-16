import express, { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import crypto from "crypto";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { sessionStore } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { LoggerService } from "./services/logger-service";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    console.warn("WARNING: SESSION_SECRET environment variable not set. Using a random secret for development only.");
    // Only allow this in development
    if (process.env.NODE_ENV === 'production') {
      throw new Error("SESSION_SECRET must be set in production environment");
    }
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Enhanced session tracking middleware to ensure user ID is always available
  app.use((req, res, next) => {
    // Only log for API routes
    if (req.path.startsWith('/api')) {
      if (req.user) {
        
        // Always sync passport user ID with session userId for authenticated users
        if (req.user.id) {
          req.session.userId = req.user.id;
        }
      } else {
        // Clear userId from session for unauthenticated users
        if (req.session) {
          req.session.userId = undefined;
        }
      }
    }
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      console.error(`[Auth] Error deserializing user: ${id}`, error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        await LoggerService.logSecurityEvent(
          null,
          'REGISTRATION_FAILED',
          `Registration attempt with existing username: ${req.body.username}`,
          { ip: req.ip }
        );
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Explicitly set userId in session
        req.session.userId = user.id;
        
        // Log successful registration
        LoggerService.logSecurityEvent(
          user.id,
          'REGISTRATION_SUCCESS',
          `User registered successfully: ${user.username}`,
          { ip: req.ip }
        );
        
        res.status(201).json(user);
      });
    } catch (error) {
      await LoggerService.logError(
        null,
        '/api/register',
        error instanceof Error ? error.message : 'Unknown registration error',
        { username: req.body?.username }
      );
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Explicitly set userId in session after login
    if (req.user) {
      req.session.userId = req.user.id;
      
      // Log successful login
      LoggerService.logSecurityEvent(
        req.user.id,
        'LOGIN_SUCCESS',
        `User logged in: ${req.user.username}`,
        { ip: req.ip }
      );
    }
    
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    const userId = req.user?.id;
    const username = req.user?.username;
    
    // Clear userId from session
    if (req.session) {
      req.session.userId = undefined;
    }
    
    req.logout((err) => {
      if (err) return next(err);
      
      // Log successful logout
      if (userId) {
        LoggerService.logSecurityEvent(
          userId,
          'LOGOUT',
          `User logged out: ${username}`,
          { ip: req.ip }
        );
      }
      
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Sync userId in session
    if (req.user && !req.session.userId) {
      req.session.userId = req.user.id;
    }
    
    res.json(req.user);
  });
}