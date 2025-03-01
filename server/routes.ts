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
    
    // Different behavior based on user role
    if (req.user.role === "coach") {
      // Coaches see teams they coach
      const teams = await storage.getTeamsByCoachId(req.user.id);
      res.json(teams);
    } else if (req.user.role === "parent") {
      // Parents see teams their children are on
      const teams = await storage.getTeamsByParentId(req.user.id);
      res.json(teams);
    } else {
      res.json([]);
    }
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

  // Get single player details
  app.get("/api/teams/:teamId/players/:playerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }
    
    const player = await storage.getPlayer(playerId);
    if (!player || player.teamId !== teamId) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
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

  // Get attendance records for a specific player
  app.get("/api/teams/:teamId/attendance/player/:playerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    
    const team = await storage.getTeam(teamId);
    if (!team || (req.user.role === "coach" && team.coachId !== req.user.id)) {
      return res.sendStatus(403);
    }
    
    const player = await storage.getPlayer(playerId);
    if (!player || player.teamId !== teamId) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const attendance = await storage.getAttendanceByPlayerId(playerId, teamId);
    res.json(attendance);
  });

  // Practice Notes
  app.post("/api/teams/:teamId/practice-notes", async (req, res) => {
    console.log('POST /api/teams/:teamId/practice-notes route hit');
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('User authenticated:', req.isAuthenticated());
    
    if (!req.isAuthenticated() || req.user.role !== "coach") {
      console.log('Authentication failed:', req.isAuthenticated(), req.user?.role);
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const teamId = parseInt(req.params.teamId);
    console.log('Team ID:', teamId);
    
    try {
      const team = await storage.getTeam(teamId);
      console.log('Team found:', team);
      
      if (!team || team.coachId !== req.user.id) {
        console.log('Authorization failed:', team?.coachId, req.user.id);
        return res.status(403).json({ error: 'Not authorized to access this team' });
      }

      console.log('Received practice note request:', req.body);
      
      // Ensure playerIds is an array
      const playerIds = Array.isArray(req.body.playerIds) ? req.body.playerIds : [];
      
      // Create the request data object
      const requestData = {
        notes: req.body.notes || '',
        teamId,
        coachId: req.user.id,
        practiceDate: req.body.practiceDate,
        playerIds
      };

      console.log('Prepared request data:', requestData);

      try {
        // Parse with Zod schema
        const parsed = insertPracticeNoteSchema.parse(requestData);
        console.log('Parsed data:', parsed);
        
        // Create the practice note
        const note = await storage.createPracticeNote(parsed);
        console.log('Created/updated practice note:', note);
        
        // Return the created note
        res.status(201).json(note);
      } catch (error: any) {
        console.error('Validation error:', error);
        res.status(400).json({ error: 'Invalid practice note data', details: error.message });
      }
    } catch (error: any) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  app.get("/api/teams/:teamId/practice-notes", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "coach") return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const team = await storage.getTeam(teamId);
    if (!team || team.coachId !== req.user.id) {
      return res.sendStatus(403);
    }
    const notes = await storage.getPracticeNotesByTeamId(teamId);
    res.json(notes);
  });

  // Get practice notes for a specific player
  app.get("/api/teams/:teamId/practice-notes/player/:playerId", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "coach") return res.sendStatus(401);
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    
    const team = await storage.getTeam(teamId);
    if (!team || team.coachId !== req.user.id) {
      return res.sendStatus(403);
    }
    
    const player = await storage.getPlayer(playerId);
    if (!player || player.teamId !== teamId) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const notes = await storage.getPracticeNotesByPlayerId(playerId, teamId);
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

  // Get payments for a specific player
  app.get("/api/teams/:teamId/payments/player/:playerId", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "coach") {
      return res.sendStatus(401);
    }
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    
    const team = await storage.getTeam(teamId);
    if (!team || team.coachId !== req.user.id) {
      return res.sendStatus(403);
    }
    
    const player = await storage.getPlayer(playerId);
    if (!player || player.teamId !== teamId) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const payments = await storage.getPaymentsByPlayerId(playerId, teamId);
    res.json(payments);
  });

  const httpServer = createServer(app);
  return httpServer;
}