import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTeamSchema, insertPlayerSchema, insertAttendanceSchema, insertSessionNoteSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Teams
  app.post("/api/teams", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "coach") {
      return res.sendStatus(401);
    }
    const parsed = insertTeamSchema.parse({ ...req.body, coachId: req.user.id });
    const team = await storage.createTeam(parsed);
    res.status(201).json(team);
  });

  app.get("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teams = await storage.getTeamsByCoachId(req.user.id);
    res.json(teams);
  });

  // Players
  app.post("/api/teams/:teamId/players", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }

    const parsed = insertPlayerSchema.parse({
      ...req.body,
      teamId,
      parentId: req.user.role === "parent" ? req.user.id : req.body.parentId,
    });
    const player = await storage.createPlayer(parsed);
    res.status(201).json(player);
  });

  app.get("/api/teams/:teamId/players", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }
    const players = await storage.getPlayersByTeamId(teamId);
    res.json(players);
  });

  // Attendance
  app.post("/api/teams/:teamId/attendance", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "coach") {
      return res.sendStatus(401);
    }
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || team.coachId !== req.user.id) return res.sendStatus(403);

    try {
      const parsed = insertAttendanceSchema.parse({
        ...req.body,
        teamId,
        date: new Date(req.body.date) // Parse the ISO string into a Date object
      });
      const attendance = await storage.createAttendance(parsed);
      res.status(201).json(attendance);
    } catch (error) {
      console.error('Error saving attendance:', error);
      res.status(400).json({ error: 'Invalid attendance data' });
    }
  });

  app.get("/api/teams/:teamId/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }
    const attendance = await storage.getAttendanceByTeamId(teamId);
    res.json(attendance);
  });

  // Session Notes
  app.post("/api/teams/:teamId/notes", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "coach") {
      return res.sendStatus(401);
    }
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || team.coachId !== req.user.id) return res.sendStatus(403);

    const parsed = insertSessionNoteSchema.parse({
      ...req.body,
      teamId,
      coachId: req.user.id,
    });
    const note = await storage.createSessionNote(parsed);
    res.status(201).json(note);
  });

  app.get("/api/teams/:teamId/notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }
    const notes = await storage.getSessionNotesByTeamId(teamId);
    res.json(notes);
  });

  const httpServer = createServer(app);
  return httpServer;
}