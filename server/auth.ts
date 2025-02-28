import express, { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import crypto from "crypto";
import { compare, hash } from "./password";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
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

// Initialize test data
export async function initializeTestData() {
  try {
    // Check if default coach exists
    let coach = await storage.getUserByUsername("omok");
    
    if (!coach) {
      const hashedPassword = await hashPassword("omok");
      coach = await storage.createUser({
        username: "omok",
        password: hashedPassword,
        role: "coach",
        name: "Otto"
      });
    }

    // Check if default team exists
    const teams = await storage.getTeamsByCoachId(coach.id);
    let team = teams[0];
    
    if (!team) {
      team = await storage.createTeam({
        name: "CMS",
        coachId: coach.id,
        description: null
      });
    }

    // Create default players if they don't exist
    const existingPlayers = await storage.getPlayersByTeamId(team.id);
    const defaultPlayers = [
      { name: "Nolan", teamId: team.id, parentId: 1, active: true },
      { name: "Alex", teamId: team.id, parentId: 2, active: true },
      { name: "Owen", teamId: team.id, parentId: 3, active: true }
    ];

    // Use Promise.all to create players in parallel
    const playerCreationPromises = defaultPlayers
      .filter(player => !existingPlayers.some(p => p.name === player.name))
      .map(player => storage.createPlayer(player));
    
    await Promise.all(playerCreationPromises);

    console.log("Test data initialization completed successfully");
  } catch (error) {
    console.error("Error initializing test data:", error);
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
    store: storage.sessionStore,
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

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
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
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}