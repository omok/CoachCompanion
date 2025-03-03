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

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
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

  // Log middleware to track session state
  app.use((req, res, next) => {
    // Only log for API routes
    if (req.path.startsWith('/api')) {
      console.log(`[Auth Debug] Path: ${req.path}, isAuthenticated: ${req.isAuthenticated()}, userId in session: ${req.session.userId || 'not set'}`);
      if (req.user) {
        console.log(`[Auth Debug] User object: ${JSON.stringify(req.user)}`);
        
        // Sync passport user ID with session userId
        if (!req.session.userId && req.user.id) {
          console.log(`[Auth Debug] Setting session.userId from req.user.id: ${req.user.id}`);
          req.session.userId = req.user.id;
        }
      } else {
        console.log('[Auth Debug] No user object in request');
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
    console.log(`[Auth] Serializing user: ${user.id}`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`[Auth] Deserializing user: ${id}`);
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
        console.log(`[Auth] User registered and logged in. Set session.userId to ${user.id}`);
        
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Explicitly set userId in session after login
    if (req.user) {
      req.session.userId = req.user.id;
      console.log(`[Auth] User logged in. Set session.userId to ${req.user.id}`);
    }
    
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    // Clear userId from session
    if (req.session) {
      req.session.userId = undefined;
      console.log(`[Auth] Cleared session.userId during logout`);
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Sync userId in session
    if (req.user && !req.session.userId) {
      req.session.userId = req.user.id;
      console.log(`[Auth] Synced session.userId to ${req.user.id} in /api/user endpoint`);
    }
    
    res.json(req.user);
  });
}