import {
  users, teams, players, attendance, practiceNotes, payments,
  type User, type Team, type Player, type Attendance, type PracticeNote, type Payment,
  type InsertUser, type InsertTeam, type InsertPlayer, type InsertAttendance, type InsertPracticeNote, type InsertPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sum } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PostgresStore = connectPgSimple(session);

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
  getAttendanceByTeamAndDate(teamId: number, date: Date): Promise<Attendance[]>;
  updateAttendance(teamId: number, date: Date, records: InsertAttendance[]): Promise<Attendance[]>;

  // Practice notes operations
  createPracticeNote(note: InsertPracticeNote): Promise<PracticeNote>;
  getPracticeNotesByTeamId(teamId: number): Promise<PracticeNote[]>;

  // New payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByTeamId(teamId: number): Promise<Payment[]>;
  getPaymentsByPlayerId(playerId: number): Promise<Payment[]>;
  getPaymentTotalsByTeam(teamId: number): Promise<{ playerId: number; total: number; }[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getTeamsByCoachId(coachId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.coachId, coachId));
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async getPlayersByTeamId(teamId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.teamId, teamId));
  }

  async createAttendance(record: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(record).returning();
    return newAttendance;
  }

  async getAttendanceByTeamId(teamId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.teamId, teamId));
  }

  async getAttendanceByTeamAndDate(teamId: number, date: Date): Promise<Attendance[]> {
    // Get the date string in YYYY-MM-DD format
    const dateStr = date.toLocaleDateString('en-CA');
    const startDate = new Date(`${dateStr}T00:00:00Z`);
    const endDate = new Date(`${dateStr}T23:59:59Z`);

    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.teamId, teamId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      );
  }

  async updateAttendance(teamId: number, date: Date, records: InsertAttendance[]): Promise<Attendance[]> {
    // Get the date string in YYYY-MM-DD format
    const dateStr = date.toLocaleDateString('en-CA');
    const startDate = new Date(`${dateStr}T00:00:00Z`);
    const endDate = new Date(`${dateStr}T23:59:59Z`);

    // Delete existing records for this date and team
    await db
      .delete(attendance)
      .where(
        and(
          eq(attendance.teamId, teamId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      );

    // Insert new records
    if (records.length > 0) {
      return await db.insert(attendance).values(records).returning();
    }

    return [];
  }

  async createPracticeNote(note: InsertPracticeNote): Promise<PracticeNote> {
    // Ensure the practice date is set to noon UTC
    const dateStr = new Date(note.practiceDate).toLocaleDateString('en-CA');
    const practiceDate = new Date(`${dateStr}T12:00:00.000Z`);

    console.log('Creating practice note:', {
      ...note,
      practiceDate,
      practiceDate_iso: practiceDate.toISOString()
    });

    try {
      const [newNote] = await db
        .insert(practiceNotes)
        .values({
          teamId: note.teamId,
          coachId: note.coachId,
          practiceDate: practiceDate,
          notes: note.notes,
          playerIds: note.playerIds || []
        })
        .returning();

      console.log('Created practice note:', newNote);

      return {
        ...newNote,
        practiceDate: new Date(
          new Date(newNote.practiceDate).toLocaleDateString('en-CA') + 'T12:00:00.000Z'
        )
      };
    } catch (error) {
      console.error('Error creating practice note:', error);
      throw error;
    }
  }

  async getPracticeNotesByTeamId(teamId: number): Promise<PracticeNote[]> {
    try {
      const notes = await db
        .select()
        .from(practiceNotes)
        .where(eq(practiceNotes.teamId, teamId))
        .orderBy(practiceNotes.practiceDate);

      console.log('Retrieved practice notes:', notes);

      // Ensure dates are handled consistently
      return notes.map(note => ({
        ...note,
        practiceDate: new Date(
          new Date(note.practiceDate).toLocaleDateString('en-CA') + 'T12:00:00.000Z'
        )
      }));
    } catch (error) {
      console.error('Error getting practice notes:', error);
      throw error;
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentsByTeamId(teamId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.teamId, teamId))
      .orderBy(payments.date);
  }

  async getPaymentsByPlayerId(playerId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.playerId, playerId))
      .orderBy(payments.date);
  }

  async getPaymentTotalsByTeam(teamId: number): Promise<{ playerId: number; total: number; }[]> {
    const result = await db
      .select({
        playerId: payments.playerId,
        total: sum(payments.amount).as('total'),
      })
      .from(payments)
      .where(eq(payments.teamId, teamId))
      .groupBy(payments.playerId)
      .orderBy(sum(payments.amount), 'desc');

    return result.map(row => ({
      playerId: row.playerId,
      total: Number(row.total) || 0,
    }));
  }
}

export const storage = new DatabaseStorage();