import {
  User, Team, Player, Attendance, SessionNote,
  InsertUser, InsertTeam, InsertPlayer, InsertAttendance, InsertSessionNote
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamsByCoachId(coachId: number): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  
  // Player operations
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByTeamId(teamId: number): Promise<Player[]>;
  
  // Attendance operations
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByTeamId(teamId: number): Promise<Attendance[]>;
  
  // Session notes operations
  createSessionNote(note: InsertSessionNote): Promise<SessionNote>;
  getSessionNotesByTeamId(teamId: number): Promise<SessionNote[]>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private players: Map<number, Player>;
  private attendance: Map<number, Attendance>;
  private sessionNotes: Map<number, SessionNote>;
  sessionStore: session.SessionStore;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.players = new Map();
    this.attendance = new Map();
    this.sessionNotes = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.currentId++;
    const newTeam: Team = { ...team, id };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async getTeamsByCoachId(coachId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.coachId === coachId,
    );
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = this.currentId++;
    const newPlayer: Player = { ...player, id };
    this.players.set(id, newPlayer);
    return newPlayer;
  }

  async getPlayersByTeamId(teamId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(
      (player) => player.teamId === teamId,
    );
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentId++;
    const newAttendance: Attendance = { ...attendance, id };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  async getAttendanceByTeamId(teamId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (record) => record.teamId === teamId,
    );
  }

  async createSessionNote(note: InsertSessionNote): Promise<SessionNote> {
    const id = this.currentId++;
    const newNote: SessionNote = { ...note, id };
    this.sessionNotes.set(id, newNote);
    return newNote;
  }

  async getSessionNotesByTeamId(teamId: number): Promise<SessionNote[]> {
    return Array.from(this.sessionNotes.values()).filter(
      (note) => note.teamId === teamId,
    );
  }
}

export const storage = new MemStorage();
