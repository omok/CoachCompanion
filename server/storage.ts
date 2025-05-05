import {
  users, teams, players, attendance, practiceNotes, payments, teamMembers,
  type User, type Team, type Player, type Attendance, type PracticeNote, type Payment, type TeamMember, type TeamMemberWithUser,
  type InsertUser, type InsertTeam, type InsertPlayer, type InsertAttendance, type InsertPracticeNote, type InsertPayment, type InsertTeamMember
} from "@shared/schema";
import { type TeamRole } from "@shared/constants";
import { db } from "./db";
import { eq, and, gte, lte, sum, desc, inArray } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { Logger } from "./logger";
import { hashPassword } from "./auth";
import { isValidTeamRole, getSuggestedTeamRole } from './utils/validation';

const PostgresStore = connectPgSimple(session);

/**
 * Storage interface for database operations
 * 
 * This interface defines all data access operations for the application.
 * It provides a clean abstraction over the database, allowing the rest of
 * the application to interact with data without knowledge of the underlying
 * storage mechanism.
 * 
 * Audit Trail Convention:
 * - All entity tables include a lastUpdatedByUser column
 * - This column tracks the ID of the user who last modified the record
 * - The storage layer automatically sets this column on all create/update operations
 * - The current user's ID must be provided in the context parameter for all operations
 */

/**
 * Session store configuration for PostgreSQL
 * 
 * This configuration is used to store session data in the PostgreSQL database,
 * providing persistent sessions across server restarts.
 */
export const sessionStore = new PostgresStore({
  pool,
  tableName: "session",
});

/**
 * Validate date format - YYYY-MM-DD
 * Following our documented date handling approach
 */
function isValidDateFormat(dateStr: string | null): boolean {
  if (!dateStr) return true; // null is valid
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Helper function to convert Date to ISO string for database
 */
function dateToISOString(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  return typeof date === 'string' ? date : date.toISOString();
}

/**
 * Helper function to ensure date is a Date object for database
 */
function ensureDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

// Add context type for operations
export interface StorageContext {
  currentUserId: number;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser, context: StorageContext): Promise<User>;

  // Team operations
  createTeam(team: InsertTeam, context: StorageContext): Promise<Team>;
  getTeamsByCoachId(coachId: number): Promise<Team[]>;
  getTeamsByParentId(parentId: number): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  updateTeam(id: number, updates: Partial<InsertTeam>, context: StorageContext): Promise<Team>;

  // Player operations
  createPlayer(player: InsertPlayer, context: StorageContext): Promise<Player>;
  getPlayersByTeamId(teamId: number): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  updatePlayer(id: number, updates: Partial<InsertPlayer>, context: StorageContext): Promise<Player>;

  // Attendance operations
  createAttendance(record: InsertAttendance, context: StorageContext): Promise<Attendance>;
  getAttendanceByTeamId(teamId: number): Promise<Attendance[]>;
  getAttendanceByTeamAndDate(teamId: number, date: Date): Promise<Attendance[]>;
  updateAttendance(teamId: number, date: Date, records: InsertAttendance[], context: StorageContext): Promise<Attendance[]>;
  getAttendanceByPlayerId(playerId: number, teamId: number): Promise<Attendance[]>;

  // Practice note operations
  createPracticeNote(note: InsertPracticeNote, context: StorageContext): Promise<PracticeNote>;
  getPracticeNotesByTeamId(teamId: number): Promise<PracticeNote[]>;
  getPracticeNotesByPlayerId(playerId: number, teamId: number): Promise<PracticeNote[]>;

  // Payment operations
  createPayment(payment: InsertPayment, context: StorageContext): Promise<Payment>;
  getPaymentsByPlayerId(playerId: number, startDate?: Date, endDate?: Date): Promise<Payment[]>;
  getPaymentsByTeamId(teamId: number, startDate?: Date, endDate?: Date): Promise<Payment[]>;
  getPaymentSummaryByTeam(teamId: number): Promise<{ playerId: number; totalAmount: string | null }[]>;

  // Team member operations
  createTeamMember(teamMember: InsertTeamMember, context: StorageContext): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMemberWithUser[]>;
  getTeamMembersByUserId(userId: number): Promise<(TeamMember & { teamName?: string })[]>;
  updateTeamMember(id: number, updates: Partial<InsertTeamMember>, context: StorageContext): Promise<TeamMember>;
  deleteTeamMember(id: number): Promise<void>;

  // New methods
  getUserById(id: number): Promise<User | undefined>;
  updateUser(user: {
    id: number;
    name?: string;
    username?: string;
    password?: string;
    role?: string;
  }, context: StorageContext): Promise<User>;
}

/**
 * Storage implementation using Drizzle ORM
 * 
 * This class implements the IStorage interface using Drizzle ORM to interact
 * with the PostgreSQL database. It handles all data access operations and
 * implements business logic related to data storage and retrieval.
 * 
 * Key design patterns used:
 * - Repository Pattern: Centralizes data access logic
 * - Data Mapper: Maps between database records and domain objects
 * - Transaction Script: Encapsulates business logic in methods
 * - Audit Trail: Automatically tracks lastUpdatedByUser for all operations
 */
export class Storage implements IStorage {
  /**
   * Helper method to add lastUpdatedByUser to insert/update operations
   * @param data - The data to be inserted/updated
   * @param context - The storage context containing the current user ID
   * @returns The data with lastUpdatedByUser added
   */
  private addAuditField<T>(data: T, context: StorageContext): T & { lastUpdatedByUser: number } {
    return {
      ...data,
      lastUpdatedByUser: context.currentUserId
    };
  }

  /**
   * Get a user by ID
   * 
   * @param id - The user's unique identifier
   * @returns The user object if found, undefined otherwise
   */
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  /**
   * Get a user by username
   * 
   * This method is primarily used for authentication purposes to look up
   * a user by their username during login.
   * 
   * @param username - The username to look up
   * @returns The user object if found, undefined otherwise
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  /**
   * Create a new user
   * 
   * This method handles user creation in a special way since the user doesn't exist yet
   * when registering. It first creates the user with a temporary lastUpdatedByUser value,
   * then updates the field with the newly created user's ID.
   */
  async createUser(user: InsertUser, context?: StorageContext): Promise<User> {
    try {
      // First create the user with a temporary lastUpdatedByUser value
      const result = await db.insert(users)
        .values({ ...user, lastUpdatedByUser: -1 }) // Use -1 as a temporary value
        .returning();

      if (!result.length) {
        throw new Error("Failed to create user");
      }

      const newUser = result[0];

      // Now update the lastUpdatedByUser field with the new user's ID
      const updatedResult = await db.update(users)
        .set({ lastUpdatedByUser: newUser.id })
        .where(eq(users.id, newUser.id))
        .returning();

      if (!updatedResult.length) {
        throw new Error("Failed to update lastUpdatedByUser for new user");
      }

      return updatedResult[0];
    } catch (error) {
      Logger.error("Error creating user", error);
      throw error;
    }
  }

  /**
   * Create a new team
   * 
   * Teams are always associated with a coach (coachId) who has administrative
   * privileges for the team.
   * 
   * @param team - The team data to insert
   * @param context - The storage context containing the current user ID
   * @returns The created team with ID assigned
   */
  async createTeam(team: InsertTeam, context: StorageContext): Promise<Team> {
    const [newTeam] = await db
      .insert(teams)
      .values({
        ...this.addAuditField(team, context),
        seasonStartDate: team.seasonStartDate ? dateToISOString(new Date(team.seasonStartDate)) : null,
        seasonEndDate: team.seasonEndDate ? dateToISOString(new Date(team.seasonEndDate)) : null,
        teamFee: team.teamFee?.toString()
      })
      .returning();
    return newTeam;
  }

  /**
   * Get all teams coached by a specific user
   * 
   * This method is used to retrieve teams for a coach's dashboard.
   * 
   * @param coachId - The coach's user ID
   * @returns Array of teams coached by the specified user
   */
  async getTeamsByCoachId(coachId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.coachId, coachId));
  }

  /**
   * Get all teams that have players parented by a specific user
   * 
   * This method implements a complex relationship query:
   * 1. Find all players where the parent ID matches the given user ID
   * 2. Extract the team IDs from those players
   * 3. Fetch all teams with those IDs
   * 
   * This allows parents to see teams their children are on without
   * having direct relationships to the teams themselves.
   * 
   * @param parentId - The parent's user ID
   * @returns Array of teams that have players parented by the specified user
   */
  async getTeamsByParentId(parentId: number): Promise<Team[]> {
    // First, get all players for this parent
    const playerResults = await db
      .select()
      .from(players)
      .where(eq(players.parentId, parentId));

    // If no players, return empty array
    if (playerResults.length === 0) {
      return [];
    }

    // Extract team IDs
    const teamIds = playerResults.map((player) => player.teamId);

    // Get all teams with those IDs
    return await db
      .select()
      .from(teams)
      .where(inArray(teams.id, teamIds));
  }

  /**
   * Get a team by ID
   * 
   * @param id - The team's unique identifier
   * @returns The team object if found, undefined otherwise
   */
  async getTeam(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id));
    return result[0];
  }

  /**
   * Create a new player
   * 
   * Players are associated with both a team (teamId) and a parent (parentId).
   * This dual association allows for:
   * 1. Team-based operations (attendance, practice notes)
   * 2. Parent-based access control (viewing their children's data)
   * 
   * @param player - The player data to insert
   * @param context - The storage context containing the current user ID
   * @returns The created player with ID assigned
   */
  async createPlayer(player: InsertPlayer, context: StorageContext): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(this.addAuditField(player, context)).returning();
    return newPlayer;
  }

  /**
   * Get all players for a specific team
   * 
   * @param teamId - The team's unique identifier
   * @returns Array of players for the specified team
   */
  async getPlayersByTeamId(teamId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.teamId, teamId));
  }

  /**
   * Get a player by ID
   * 
   * @param id - The player's unique identifier
   * @returns The player object if found, undefined otherwise
   */
  async getPlayer(id: number): Promise<Player | undefined> {
    const result = await db.select().from(players).where(eq(players.id, id));
    return result[0];
  }

  /**
   * Update a player's information
   * 
   * @param id - The player's unique identifier
   * @param updates - Partial player data to update
   * @param context - The storage context containing the current user ID
   * @returns The updated player
   */
  async updatePlayer(id: number, updates: Partial<InsertPlayer>, context: StorageContext): Promise<Player> {
    const [updatedPlayer] = await db
      .update(players)
      .set(this.addAuditField(updates, context))
      .where(eq(players.id, id))
      .returning();
    return updatedPlayer;
  }

  /**
   * Create a new attendance record
   * 
   * @param record - The attendance data to insert
   * @param context - The storage context containing the current user ID
   * @returns The created attendance record with ID assigned
   */
  async createAttendance(record: InsertAttendance, context: StorageContext): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(this.addAuditField(record, context)).returning();
    return newAttendance;
  }

  /**
   * Get all attendance records for a specific team
   * 
   * @param teamId - The team's unique identifier
   * @returns Array of attendance records for the specified team
   */
  async getAttendanceByTeamId(teamId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.teamId, teamId));
  }

  /**
   * Get attendance records for a specific team on a specific date
   * 
   * This method handles date range queries by converting the provided date
   * to a full day range (00:00:00 to 23:59:59) to ensure all records for
   * the specified date are returned regardless of the time component.
   * 
   * @param teamId - The team's unique identifier
   * @param date - The date to get attendance for
   * @returns Array of attendance records for the specified team and date
   */
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

  /**
   * Update attendance records for a team on a specific date
   * 
   * This method implements an "upsert" pattern by:
   * 1. Deleting all existing attendance records for the team and date
   * 2. Inserting new attendance records
   * 
   * This approach ensures that the attendance records for a specific date
   * are always consistent and avoids having to track which records need
   * to be updated, deleted, or inserted individually.
   * 
   * @param teamId - The team's unique identifier
   * @param date - The date to update attendance for
   * @param records - The new attendance records
   * @param context - The storage context containing the current user ID
   * @returns Array of updated attendance records
   */
  async updateAttendance(teamId: number, date: Date, records: InsertAttendance[], context: StorageContext): Promise<Attendance[]> {

    // Get the date string in YYYY-MM-DD format
    const dateStr = date.toLocaleDateString('en-CA');
    const startDate = new Date(`${dateStr}T00:00:00Z`);
    const endDate = new Date(`${dateStr}T23:59:59Z`);

    Logger.debug(`[Storage] Date range for attendance delete operation`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dateStr
    });

    try {
      // Delete existing records for this date and team
      const deleteResult = await db
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
        Logger.debug(`[Storage] Inserting ${records.length} attendance records`, {
          firstRecord: records[0],
          lastRecord: records[records.length - 1]
        });
        
        const recordsWithAudit = records.map(record => ({
          ...this.addAuditField(record, context),
          date: ensureDate(record.date)
        }));
        const result = await db.insert(attendance).values(recordsWithAudit).returning();
        return result;
      }

      return [];
    } catch (error) {
      Logger.error(`[Storage] Error updating attendance records`, { error });
      throw error;
    }
  }

  /**
   * Get attendance records for a specific player
   * 
   * This method retrieves all attendance records for a player within a specific team.
   * The teamId parameter is required for security to ensure that only authorized
   * users can access the attendance records.
   * 
   * @param playerId - The player's unique identifier
   * @param teamId - The team's unique identifier
   * @returns Array of attendance records for the specified player
   */
  async getAttendanceByPlayerId(playerId: number, teamId: number): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.playerId, playerId),
          eq(attendance.teamId, teamId)
        )
      );
  }

  /**
   * Create a new practice note
   * 
   * This method handles the creation of practice notes with special handling for dates.
   * It implements an "upsert" pattern where:
   * 1. If a note already exists for the team and date, it updates that note
   * 2. Otherwise, it creates a new note
   * 
   * This approach ensures that there is only one practice note per team per date,
   * simplifying the data model and preventing duplicate notes.
   * 
   * The method also standardizes dates to UTC noon to ensure consistent behavior
   * across different timezones.
   * 
   * @param note - The practice note data to insert
   * @param context - The storage context containing the current user ID
   * @returns The created or updated practice note
   */
  async createPracticeNote(note: InsertPracticeNote, context: StorageContext): Promise<PracticeNote> {
    try {
      // Standardize the date to UTC noon to avoid timezone issues
      const practiceDate = new Date(note.practiceDate);
      practiceDate.setUTCHours(12, 0, 0, 0);

      // Check if a note already exists for this team and date
      const existingNotes = await db
        .select()
        .from(practiceNotes)
        .where(
          and(
            eq(practiceNotes.teamId, note.teamId),
            eq(practiceNotes.practiceDate, practiceDate)
          )
        );

      let newNote: PracticeNote;

      if (existingNotes.length > 0) {
        // Update existing note
        const [updatedNote] = await db
          .update(practiceNotes)
          .set({
            notes: note.notes,
            playerIds: note.playerIds || existingNotes[0].playerIds
          })
          .where(eq(practiceNotes.id, existingNotes[0].id))
          .returning();
          
        newNote = updatedNote;
      } else {
        // Create new note
        const [createdNote] = await db
          .insert(practiceNotes)
          .values(this.addAuditField({
            teamId: note.teamId,
            coachId: note.coachId,
            practiceDate,
            notes: note.notes,
            playerIds: note.playerIds || []
          }, context))
          .returning();
          
        newNote = createdNote;
      }

      // Standardize the returned date
      const standardizedDate = new Date(newNote.practiceDate);
      standardizedDate.setUTCHours(12, 0, 0, 0);

      return {
        ...newNote,
        practiceDate: standardizedDate
      };
    } catch (error) {
      console.error('Error creating practice note:', error);
      throw error;
    }
  }

  /**
   * Get all practice notes for a specific team
   * 
   * This method retrieves practice notes for a team and standardizes
   * the dates to UTC noon to ensure consistent behavior across timezones.
   * Notes are ordered by date in descending order (newest first).
   * 
   * @param teamId - The team's unique identifier
   * @returns Array of practice notes for the specified team
   */
  async getPracticeNotesByTeamId(teamId: number): Promise<PracticeNote[]> {
    try {
      const notes = await db
        .select()
        .from(practiceNotes)
        .where(eq(practiceNotes.teamId, teamId))
        .orderBy(desc(practiceNotes.practiceDate));

      // Standardize dates to UTC noon
      return notes.map(note => {
        const standardizedDate = new Date(note.practiceDate);
        standardizedDate.setUTCHours(12, 0, 0, 0);
        
        return {
          ...note,
          practiceDate: standardizedDate
        };
      });
    } catch (error) {
      console.error('Error getting practice notes:', error);
      throw error;
    }
  }

  /**
   * Create a new payment record
   * 
   * This method handles the conversion of payment amounts from string to numeric format,
   * ensuring that the amount is properly stored in the database.
   * 
   * @param payment - The payment data to insert
   * @param context - The storage context containing the current user ID
   * @returns The created payment record with ID assigned
   */
  async createPayment(payment: InsertPayment, context: StorageContext): Promise<Payment> {
    try {
      // Ensure amount is properly formatted for the database
      const amount = typeof payment.amount === 'number' 
        ? payment.amount.toString() 
        : payment.amount;
      
      // Convert string date to Date object for the database timestamp field
      const dateValue = ensureDate(payment.date);
      
      const [newPayment] = await db
        .insert(payments)
        .values(this.addAuditField({
          playerId: payment.playerId,
          teamId: payment.teamId,
          amount,
          date: dateValue,
          notes: payment.notes
        }, context))
        .returning();
      return newPayment;
    } catch (error) {
      Logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get all payment records for a specific player
   * 
   * This method retrieves payment records for a player with optional date range filtering.
   * It provides a financial history for the player.
   * 
   * @param playerId - The player's unique identifier
   * @param startDate - Optional start date for filtering (inclusive)
   * @param endDate - Optional end date for filtering (inclusive)
   * @returns Array of payment records for the specified player and date range
   */
  async getPaymentsByPlayerId(
    playerId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Payment[]> {
    let conditions = [eq(payments.playerId, playerId)];
    
    // Add date range filters if provided
    if (startDate) {
      conditions.push(gte(payments.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(payments.date, endDate));
    }
    
    return await db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.date));
  }

  /**
   * Get all payment records for a specific team
   * 
   * This method retrieves payment records for a team with optional date range filtering.
   * It provides a comprehensive financial overview for the team.
   * 
   * @param teamId - The team's unique identifier
   * @param startDate - Optional start date for filtering (inclusive)
   * @param endDate - Optional end date for filtering (inclusive)
   * @returns Array of payment records for the specified team and date range
   */
  async getPaymentsByTeamId(
    teamId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Payment[]> {
    let conditions = [eq(payments.teamId, teamId)];
    
    // Add date range filters if provided
    if (startDate) {
      conditions.push(gte(payments.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(payments.date, endDate));
    }
    
    return await db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.date));
  }

  /**
   * Get payment summary by team
   * 
   * This method calculates the total amount paid by each player in a team.
   * It uses SQL aggregation to sum the payment amounts grouped by player.
   * 
   * This is useful for generating financial reports and tracking which players
   * have paid their fees.
   * 
   * @param teamId - The team's unique identifier
   * @returns Array of objects containing player ID and total amount paid
   */
  async getPaymentSummaryByTeam(
    teamId: number
  ): Promise<{ playerId: number; totalAmount: string | null }[]> {
    return await db
      .select({
        playerId: payments.playerId,
        totalAmount: sum(payments.amount).as("totalAmount"),
      })
      .from(payments)
      .where(eq(payments.teamId, teamId))
      .groupBy(payments.playerId);
  }

  /**
   * Get practice notes for a specific player
   * 
   * This method retrieves practice notes that include a specific player.
   * It filters notes based on the playerIds array containing the specified player ID.
   * 
   * @param playerId - The player's unique identifier
   * @param teamId - The team's unique identifier
   * @returns Array of practice notes that include the specified player
   */
  async getPracticeNotesByPlayerId(
    playerId: number,
    teamId: number
  ): Promise<PracticeNote[]> {
    // Get all practice notes for the team
    const allNotes = await this.getPracticeNotesByTeamId(teamId);
    
    // Filter notes that include this player
    return allNotes.filter(note => 
      note.playerIds && note.playerIds.includes(playerId)
    );
  }

  /**
   * Get teams by coach ID
   */
  async getTeams(coachId: number): Promise<Team[]> {
    try {
      return await db.select().from(teams).where(eq(teams.coachId, coachId));
    } catch (error) {
      Logger.error("Error fetching teams by coach ID", error);
      throw error;
    }
  }
  
  /**
   * Get team by ID
   */
  async getTeamById(id: number): Promise<Team | undefined> {
    try {
      const result = await db.select().from(teams).where(eq(teams.id, id));
      return result[0];
    } catch (error) {
      Logger.error("Error fetching team by ID", error);
      throw error;
    }
  }
  
  /**
   * Update a team's information
   */
  async updateTeam(id: number, updates: Partial<InsertTeam>, context: StorageContext): Promise<Team> {
    try {
      // Create a new object with all props from updates
      // This ensures we don't lose any fields that aren't explicitly handled below
      const baseUpdates = { ...updates };
      
      // Add explicitly handled fields 
      const sanitizedUpdates = {
        ...this.addAuditField(baseUpdates, context),
        seasonStartDate: updates.seasonStartDate ? dateToISOString(new Date(updates.seasonStartDate)) : null,
        seasonEndDate: updates.seasonEndDate ? dateToISOString(new Date(updates.seasonEndDate)) : null,
        feeType: updates.feeType || null, 
        teamFee: updates.teamFee ? updates.teamFee.toString() : null
      };

      const result = await db.update(teams)
        .set(sanitizedUpdates)
        .where(eq(teams.id, id))
        .returning();
      
      if (!result.length) {
        throw new Error(`Team with ID ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      Logger.error("Error updating team", error);
      throw error;
    }
  }

  /**
   * Create a new team member
   * 
   * @param teamMember - The team member data to insert
   * @param context - The storage context containing the current user ID
   * @returns The created team member with ID assigned
   */
  async createTeamMember(teamMember: InsertTeamMember, context: StorageContext): Promise<TeamMember> {
    try {
      // Validate and potentially correct the role
      if (!isValidTeamRole(teamMember.role)) {
        const suggestedRole = getSuggestedTeamRole(teamMember.role);
        
        if (suggestedRole !== teamMember.role) {
          teamMember.role = suggestedRole as TeamRole;
        } else {
          // If we can't suggest a correction, log a warning but continue with validation error
          Logger.warn(`Creating team member with invalid role: ${teamMember.role}`, {
            teamId: teamMember.teamId,
            userId: teamMember.userId
          });
        }
      }
      
      const result = await db
        .insert(teamMembers)
        .values(this.addAuditField(teamMember, context))
        .returning();
      
      return result[0];
    } catch (error) {
      Logger.error("Error creating team member", error);
      throw error;
    }
  }

  /**
   * Get all members of a team
   * 
   * @param teamId - The team's unique identifier
   * @returns Array of team members with user information for the specified team
   */
  async getTeamMembers(teamId: number): Promise<TeamMemberWithUser[]> {
    try {
      return await db
        .select({
          id: teamMembers.id,
          teamId: teamMembers.teamId,
          userId: teamMembers.userId,
          role: teamMembers.role,
          isOwner: teamMembers.isOwner,
          userName: users.name,
          userEmail: users.username // Using username as email since that's our login field
        })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.teamId, teamId));
    } catch (error) {
      Logger.error("Error fetching team members", error);
      throw error;
    }
  }

  /**
   * Get all team memberships for a user
   * 
   * This method retrieves all teams a user is a member of, along with their role
   * in each team. It includes the team name for convenience.
   * 
   * @param userId - The user's unique identifier
   * @returns Array of team memberships with team names
   */
  async getTeamMembersByUserId(userId: number): Promise<(TeamMember & { teamName?: string })[]> {
    try {
      
      // Get team memberships
      const query = db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
      
      const memberships = await query;
      
      // If no memberships, return empty array
      if (memberships.length === 0) {
        return [];
      }
      
      // Get team names
      const teamIds = memberships.map(membership => membership.teamId);
      
      const teamQuery = db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(inArray(teams.id, teamIds));
      
      const teamInfo = await teamQuery;
      
      // Combine membership data with team names
      const result = memberships.map(membership => {
        const team = teamInfo.find(t => t.id === membership.teamId);
        return {
          ...membership,
          teamName: team?.name
        };
      });
      
      return result;
    } catch (error) {
      console.error(`[Storage] Error fetching team memberships for userId: ${userId}`, error);
      Logger.error("Error fetching user team memberships", error);
      throw error;
    }
  }

  /**
   * Update a team member's information
   * 
   * @param id - The team member's unique identifier
   * @param updates - The updated team member data
   * @param context - The storage context containing the current user ID
   * @returns The updated team member
   */
  async updateTeamMember(id: number, updates: Partial<InsertTeamMember>, context: StorageContext): Promise<TeamMember> {
    try {
      // Validate role if it's being updated
      if (updates.role && !isValidTeamRole(updates.role)) {
        const suggestedRole = getSuggestedTeamRole(updates.role);
        
        if (suggestedRole !== updates.role) {
          updates.role = suggestedRole as TeamRole;
        } else {
          // If we can't suggest a correction, log a warning but continue with validation error
          Logger.warn(`Updating team member with invalid role: ${updates.role}`, {
            teamMemberId: id
          });
        }
      }
      
      const result = await db
        .update(teamMembers)
        .set(this.addAuditField(updates, context))
        .where(eq(teamMembers.id, id))
        .returning();
      
      if (!result.length) {
        throw new Error(`Team member with id ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      Logger.error(`Error updating team member: ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a team member
   * 
   * @param id - The team member's unique identifier
   */
  async deleteTeamMember(id: number): Promise<void> {
    try {
      await db.delete(teamMembers).where(eq(teamMembers.id, id));
    } catch (error) {
      Logger.error("Error deleting team member", error);
      throw error;
    }
  }

  /**
   * Get a user by ID
   * 
   * @param id - The user ID
   * @returns User object or undefined if not found
   */
  async getUserById(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      Logger.error("Error in getUserById", error);
      throw error;
    }
  }
  
  /**
   * Update a user's profile
   * 
   * @param userData - The user data to update
   * @param context - The context for the operation
   * @returns Updated user object
   */
  async updateUser(userData: {
    id: number;
    name?: string;
    username?: string;
    password?: string;
    role?: string;
  }, context: StorageContext): Promise<User> {
    try {
      const { id, ...updateData } = userData;
      
      // If password is being updated, hash it
      if (updateData.password) {
        const passwordHash = await hashPassword(updateData.password);
        updateData.password = passwordHash;
      }
      
      // Always set the lastUpdatedByUser field
      const updateWithMeta = {
        ...updateData,
        lastUpdatedByUser: context.currentUserId,
      };
      
      const result = await db
        .update(users)
        .set(updateWithMeta)
        .where(eq(users.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error(`User with id ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      Logger.error("Error in updateUser", error);
      throw error;
    }
  }
}

export const storage = new Storage();