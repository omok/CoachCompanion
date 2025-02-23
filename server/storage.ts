import {
  User, Team, Player, Attendance, PracticeNote,
  InsertUser, InsertTeam, InsertPlayer, InsertAttendance, InsertPracticeNote
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

  // Practice notes operations
  createPracticeNote(note: InsertPracticeNote): Promise<PracticeNote>;
  getPracticeNotesByTeamId(teamId: number): Promise<PracticeNote[]>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private players: Map<number, Player>;
  private attendance: Map<number, Attendance>;
  private practiceNotes: Map<number, PracticeNote>;
  sessionStore: session.SessionStore;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.players = new Map();
    this.attendance = new Map();
    this.practiceNotes = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Add default test data
    const coach = {
      id: this.currentId++,
      username: "omok",
      password: "$2b$10$K.0HwpsoPDGaB/atFBmmXOd6GqGjC9DJWOcqYB9Y2HJtJEHQHAoY.", // hashed 'omok'
      role: "coach",
      name: "Otto"
    };
    this.users.set(coach.id, coach);

    // Create default team
    const team = {
      id: this.currentId++,
      name: "CMS",
      coachId: coach.id,
      description: ""
    };
    this.teams.set(team.id, team);

    // Create default players
    const players = [
      { id: this.currentId++, name: "Nolan", teamId: team.id, parentId: 1, active: true },
      { id: this.currentId++, name: "Alex", teamId: team.id, parentId: 2, active: true },
      { id: this.currentId++, name: "Owen", teamId: team.id, parentId: 3, active: true }
    ];
    players.forEach(player => this.players.set(player.id, player));
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
    const newAttendance: Attendance = {
      ...attendance,
      id,
      date: new Date(attendance.date) // Ensure date is properly converted
    };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  async getAttendanceByTeamId(teamId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (record) => record.teamId === teamId,
    );
  }

  async createPracticeNote(note: InsertPracticeNote): Promise<PracticeNote> {
    const id = this.currentId++;
    const newNote: PracticeNote = {
      ...note,
      id,
      practiceDate: new Date(note.practiceDate),
    };
    this.practiceNotes.set(id, newNote);
    return newNote;
  }

  async getPracticeNotesByTeamId(teamId: number): Promise<PracticeNote[]> {
    return Array.from(this.practiceNotes.values()).filter(
      (note) => note.teamId === teamId,
    );
  }
}

export const storage = new MemStorage();