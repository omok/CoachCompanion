import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, initializeTestData } from "./auth";
import { storage } from "./storage";
import { insertTeamSchema, insertPlayerSchema, insertAttendanceSchema, insertPracticeNoteSchema, insertPaymentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Initialize test data
  await initializeTestData();

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
      const date = new Date(req.body.date);
      const records = req.body.records.map((record: any) => ({
        playerId: record.playerId,
        teamId,
        date,
        present: record.present
      }));

      // Update attendance records
      const attendance = await storage.updateAttendance(teamId, date, records);
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

  // Practice Notes
  app.post("/api/teams/:teamId/practice-notes", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "coach") {
      return res.sendStatus(401);
    }
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || team.coachId !== req.user.id) return res.sendStatus(403);

    try {
      const requestData = {
        ...req.body,
        teamId,
        coachId: req.user.id,
        practiceDate: new Date(req.body.practiceDate)
      };

      const parsed = insertPracticeNoteSchema.parse(requestData);
      const note = await storage.createPracticeNote(parsed);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error saving practice note:', error);
      res.status(400).json({ error: 'Invalid practice note data' });
    }
  });

  app.get("/api/teams/:teamId/practice-notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }
    const notes = await storage.getPracticeNotesByTeamId(teamId);
    res.json(notes);
  });

  // Payments
  app.post("/api/teams/:teamId/payments", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "coach") {
      return res.sendStatus(401);
    }
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || team.coachId !== req.user.id) return res.sendStatus(403);

    try {
      const parsed = insertPaymentSchema.parse({
        ...req.body,
        teamId,
      });
      const payment = await storage.createPayment(parsed);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(400).json({ error: 'Invalid payment data' });
    }
  });

  app.get("/api/teams/:teamId/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }
    const payments = await storage.getPaymentsByTeamId(teamId);
    res.json(payments);
  });

  app.get("/api/teams/:teamId/payments/totals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }
    const totals = await storage.getPaymentTotalsByTeam(teamId);
    res.json(totals);
  });

  const httpServer = createServer(app);
  return httpServer;
}