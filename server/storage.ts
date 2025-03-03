import {
  users, teams, players, attendance, practiceNotes, payments, teamMembers,
  type User, type Team, type Player, type Attendance, type PracticeNote, type Payment, type TeamMember,
  type InsertUser, type InsertTeam, type InsertPlayer, type InsertAttendance, type InsertPracticeNote, type InsertPayment, type InsertTeamMember
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sum, desc, inArray } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { Logger } from "./logger";

const PostgresStore = connectPgSimple(session);

/**
 * Storage interface for database operations
 * 
 * This interface defines all data access operations for the application.
 * It provides a clean abstraction over the database, allowing the rest of
 * the application to interact with data without knowledge of the underlying
 * storage mechanism.
 */
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamsByCoachId(coachId: number): Promise<Team[]>;
  getTeamsByParentId(parentId: number): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeams(coachId: number): Promise<Team[]>;
  getTeamById(id: number): Promise<Team | undefined>;
  updateTeam(id: number, updates: Partial<Omit<InsertTeam, 'seasonStartDate' | 'seasonEndDate' | 'teamFee'>> & {
    seasonStartDate?: string | null;
    seasonEndDate?: string | null;
    teamFee?: string | number | null;
  }): Promise<Team>;

  // Player operations
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByTeamId(teamId: number): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  updatePlayer(id: number, updates: Partial<InsertPlayer>): Promise<Player>;

  // Attendance operations
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByTeamId(teamId: number): Promise<Attendance[]>;
  getAttendanceByTeamAndDate(teamId: number, date: Date): Promise<Attendance[]>;
  updateAttendance(teamId: number, date: Date, records: InsertAttendance[]): Promise<Attendance[]>;
  getAttendanceByPlayerId(playerId: number, teamId: number): Promise<Attendance[]>;

  // Practice notes operations
  createPracticeNote(note: InsertPracticeNote): Promise<PracticeNote>;
  getPracticeNotesByTeamId(teamId: number): Promise<PracticeNote[]>;
  getPracticeNotesByPlayerId(playerId: number, teamId: number): Promise<PracticeNote[]>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByPlayerId(playerId: number, startDate?: Date, endDate?: Date): Promise<Payment[]>;
  getPaymentsByTeamId(teamId: number, startDate?: Date, endDate?: Date): Promise<Payment[]>;
  getPaymentSummaryByTeam(teamId: number): Promise<{ playerId: number; totalAmount: string | null }[]>;

  // Team Member operations
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMembersByUserId(userId: number): Promise<(TeamMember & { teamName?: string })[]>;
  updateTeamMember(id: number, updates: Partial<InsertTeamMember>): Promise<TeamMember>;
  deleteTeamMember(id: number): Promise<void>;
}

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
 */
export class Storage implements IStorage {
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
   * This method handles user creation with appropriate validation.
   * Note that password hashing should be done before calling this method.
   * 
   * @param user - The user data to insert
   * @returns The created user with ID assigned
   */
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  /**
   * Create a new team
   * 
   * Teams are always associated with a coach (coachId) who has administrative
   * privileges for the team.
   * 
   * @param team - The team data to insert
   * @returns The created team with ID assigned
   */
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
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
   * @returns The created player with ID assigned
   */
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
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
   * @returns The updated player
   */
  async updatePlayer(id: number, updates: Partial<InsertPlayer>): Promise<Player> {
    const [updatedPlayer] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, id))
      .returning();
    return updatedPlayer;
  }

  /**
   * Create a new attendance record
   * 
   * @param record - The attendance data to insert
   * @returns The created attendance record with ID assigned
   */
  async createAttendance(record: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(record).returning();
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
   * @returns Array of updated attendance records
   */
  async updateAttendance(teamId: number, date: Date, records: InsertAttendance[]): Promise<Attendance[]> {
    Logger.info(`[Storage] updateAttendance started for team ${teamId}`, {
      date: date.toISOString(),
      recordCount: records.length,
      presentCount: records.filter(r => r.present).length
    });

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
      
      Logger.info(`[Storage] Deleted existing attendance records`, { deleteResult });

      // Insert new records
      if (records.length > 0) {
        Logger.debug(`[Storage] Inserting ${records.length} attendance records`, {
          firstRecord: records[0],
          lastRecord: records[records.length - 1]
        });
        
        const result = await db.insert(attendance).values(records).returning();
        Logger.info(`[Storage] Successfully inserted ${result.length} attendance records`);
        return result;
      }

      Logger.info(`[Storage] No attendance records to insert`);
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
   * @returns The created or updated practice note
   */
  async createPracticeNote(note: InsertPracticeNote): Promise<PracticeNote> {
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
          .values({
            teamId: note.teamId,
            coachId: note.coachId,
            practiceDate: practiceDate,
            notes: note.notes,
            playerIds: note.playerIds || []
          })
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
   * @returns The created payment record with ID assigned
   */
  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      // Ensure amount is properly formatted for the database
      // The database expects a string for numeric fields when using Drizzle ORM
      const amount = typeof payment.amount === 'number' 
        ? payment.amount.toString() 
        : payment.amount;
      
      // Convert string date to Date object for the database timestamp field
      let dateValue: Date;
      if (typeof payment.date === 'string') {
        Logger.info(`Converting payment date string: ${payment.date} to Date object`);
        // Create date at noon UTC to avoid timezone issues
        dateValue = new Date(`${payment.date}T12:00:00Z`);
      } else {
        dateValue = payment.date;
      }
      
      const [newPayment] = await db
        .insert(payments)
        .values({
          playerId: payment.playerId,
          teamId: payment.teamId,
          amount, // Pass as string to match the database schema expectation
          date: dateValue, // Use Date object for timestamp field
          notes: payment.notes
        })
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
  async updateTeam(id: number, updates: Partial<Omit<InsertTeam, 'seasonStartDate' | 'seasonEndDate' | 'teamFee'>> & {
    seasonStartDate?: string | null;
    seasonEndDate?: string | null;
    teamFee?: string | number | null;
  }): Promise<Team> {
    try {
      Logger.info(`Updating team ${id} with data:`, updates);
      
      // Create a clean object for updates
      const sanitizedUpdates: Record<string, any> = {};
      
      // Only include defined fields in the update
      if (updates.name !== undefined) sanitizedUpdates.name = updates.name;
      if (updates.description !== undefined) sanitizedUpdates.description = updates.description;
      if (updates.coachId !== undefined) sanitizedUpdates.coachId = updates.coachId;
      
      // For date fields, validate format and pass through
      if (updates.seasonStartDate !== undefined) {
        if (isValidDateFormat(updates.seasonStartDate)) {
          sanitizedUpdates.seasonStartDate = updates.seasonStartDate;
        } else {
          Logger.warn(`Invalid start date format, setting to null: ${updates.seasonStartDate}`);
          sanitizedUpdates.seasonStartDate = null;
        }
      }
      
      if (updates.seasonEndDate !== undefined) {
        if (isValidDateFormat(updates.seasonEndDate)) {
          sanitizedUpdates.seasonEndDate = updates.seasonEndDate;
        } else {
          Logger.warn(`Invalid end date format, setting to null: ${updates.seasonEndDate}`);
          sanitizedUpdates.seasonEndDate = null;
        }
      }
      
      // Convert teamFee to string if it's a number
      if (updates.teamFee !== undefined) {
        if (typeof updates.teamFee === 'number') {
          sanitizedUpdates.teamFee = String(updates.teamFee);
        } else {
          sanitizedUpdates.teamFee = updates.teamFee;
        }
      }
      
      Logger.info(`Sanitized updates for team ${id}:`, sanitizedUpdates);
      
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
   * This method adds a user to a team with a specific role
   * 
   * @param teamMember - The team member data to insert
   * @returns The created team member with ID assigned
   */
  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    try {
      const [newTeamMember] = await db.insert(teamMembers).values(teamMember).returning();
      return newTeamMember;
    } catch (error) {
      Logger.error("Error creating team member", error);
      throw error;
    }
  }

  /**
   * Get all members of a team
   * 
   * @param teamId - The team's unique identifier
   * @returns Array of team members for the specified team
   */
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    try {
      return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
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
   * @returns The updated team member
   */
  async updateTeamMember(id: number, updates: Partial<InsertTeamMember>): Promise<TeamMember> {
    try {
      const result = await db.update(teamMembers)
        .set(updates)
        .where(eq(teamMembers.id, id))
        .returning();
      
      if (!result.length) {
        throw new Error(`Team member with ID ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      Logger.error("Error updating team member", error);
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
}

export const storage = new Storage();