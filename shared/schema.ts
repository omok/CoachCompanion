/**
 * Database schema definitions using Drizzle ORM
 *
 * Conventions:
 * - All entity tables must include a lastUpdatedByUser column for audit tracking
 * - This column stores the user ID of the person who last modified the record
 * - The column is required (not null) to ensure audit trail completeness
 */

import { pgTable, varchar, serial, integer, boolean, timestamp, json, numeric, date, uuid, text, real } from "drizzle-orm/pg-core";
import { z } from "zod";
import { USER_ROLES, TEAM_ROLES, type UserRole, type TeamRole } from './constants';

// Add session table definition to prevent Drizzle from trying to drop it
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
}, (table) => ({
  // Mark this table to be ignored by Drizzle migrations
  __ignore: true,
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  password: varchar("password").notNull(),
  role: varchar("role").notNull(), // Coach or Normal
  name: varchar("name").notNull(),
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  coachId: integer("coach_id").notNull(),
  description: varchar("description"),
  seasonStartDate: date("season_start_date"),
  seasonEndDate: date("season_end_date"),
  feeType: varchar("fee_type").default("fixed"),
  teamFee: numeric("team_fee"),
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

// Team members table for tracking team roles
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id").notNull(),
  role: varchar("role").notNull(), // Owner, AssistantCoach, TeamManager, Regular
  isOwner: boolean("is_owner").notNull().default(false),
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

// Extended type for team member with user info
export type TeamMemberWithUser = {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  isOwner: boolean;
  userName: string;
  userEmail: string;
};

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  teamId: integer("team_id").notNull(),
  parentId: integer("parent_id").notNull(),
  active: boolean("active").notNull().default(true),
  jerseyNumber: varchar("jersey_number"),
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  teamId: integer("team_id").notNull(),
  date: timestamp("date").notNull(),
  present: boolean("present").notNull(),
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

export const practiceNotes = pgTable("practice_notes", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  coachId: integer("coach_id").notNull(),
  practiceDate: timestamp("practice_date").notNull(),
  notes: varchar("notes").notNull(),
  playerIds: integer("player_ids").array(),
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

// New payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  teamId: integer("team_id").notNull(),
  amount: numeric("amount").notNull(),
  date: timestamp("date").notNull(),
  notes: varchar("notes"),
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

// Session tracking table
export const sessionBalances = pgTable("session_balances", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  teamId: integer("team_id").notNull(),
  totalSessions: integer("total_sessions").notNull(),
  usedSessions: integer("used_sessions").notNull().default(0),
  remainingSessions: integer("remaining_sessions").notNull(),
  expirationDate: date("expiration_date"),
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

// Session transactions table to track history of session changes
export const sessionTransactions = pgTable("session_transactions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  teamId: integer("team_id").notNull(),
  date: timestamp("date").notNull(),
  sessionChange: integer("session_change").notNull(), // Positive for additions, negative for deductions
  reason: varchar("reason").notNull(), // e.g., "purchase", "attendance", "adjustment"
  notes: varchar("notes"),
  paymentId: integer("payment_id"), // Optional link to a payment record
  attendanceId: integer("attendance_id"), // Optional link to an attendance record
  lastUpdatedByUser: integer("lastUpdatedByUser").notNull(),
});

// System usage logs table for analytics and monitoring
export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").primaryKey(),
  userId: integer("user_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  action: varchar("action", { length: 255 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  statusCode: integer("status_code"),
  responseTime: real("response_time"),
  errorMessage: text("error_message"),
  additionalData: json("additional_data"),
});

export const insertUserSchema = z.object({
  id: z.number().optional(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum([USER_ROLES.COACH, USER_ROLES.NORMAL]),
});

export const insertTeamSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  coachId: z.number(),
  description: z.string().optional(),
  seasonStartDate: z.string().transform(date => date ? new Date(date) : undefined).optional(),
  seasonEndDate: z.string().transform(date => date ? new Date(date) : undefined).optional(),
  feeType: z.enum(["fixed", "prepaid"]).default("fixed"),
  teamFee: z.string().transform(val => val ? Number(val) : undefined)
    .pipe(z.number().positive().multipleOf(0.01).optional())
    .optional(),
});

// Schema for team membership
export const insertTeamMemberSchema = z.object({
  teamId: z.number(),
  userId: z.number(),
  role: z.enum([TEAM_ROLES.OWNER, TEAM_ROLES.ASSISTANT_COACH, TEAM_ROLES.TEAM_MANAGER, TEAM_ROLES.REGULAR]),
  isOwner: z.boolean().optional().default(false),
});

export const insertPlayerSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  teamId: z.number(),
  parentId: z.number(),
  active: z.boolean().optional(),
  jerseyNumber: z.string().optional(),
});

export const insertAttendanceSchema = z.object({
  id: z.number().optional(),
  playerId: z.number(),
  teamId: z.number(),
  date: z.string().transform(date => new Date(date)),
  present: z.boolean(),
});

export const insertPracticeNoteSchema = z.object({
  teamId: z.number(),
  coachId: z.number(),
  practiceDate: z.string().transform(date => new Date(date)),
  notes: z.string(),
  playerIds: z.number().array().default([])
});

// New payment schema
export const insertPaymentSchema = z.object({
  playerId: z.number(),
  teamId: z.number(),
  amount: z.string()
    .transform((val) => Number(val))
    .pipe(z.number().positive().multipleOf(0.01)),
  date: z.union([z.string(), z.instanceof(Date)]),
  notes: z.string().optional(),
  addPrepaidSessions: z.boolean().optional(),
  sessionCount: z.number().int().positive().optional(),
});

// Session balance schema
export const insertSessionBalanceSchema = z.object({
  playerId: z.number(),
  teamId: z.number(),
  totalSessions: z.number().int().positive(),
  usedSessions: z.number().int().min(0).optional(),
  remainingSessions: z.number().int().min(0),
  expirationDate: z.union([z.string(), z.date()]).optional(),
});

// Session transaction schema
export const insertSessionTransactionSchema = z.object({
  playerId: z.number(),
  teamId: z.number(),
  date: z.union([z.string(), z.instanceof(Date)]),
  sessionChange: z.number().int(),
  reason: z.string(),
  notes: z.string().optional(),
  paymentId: z.number().optional(),
  attendanceId: z.number().optional(),
});

/**
 * Schema for updating user profile
 */
export const updateUserProfileSchema = z.object({
  id: z.number(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.string(),
});

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type PracticeNote = typeof practiceNotes.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type SessionBalance = typeof sessionBalances.$inferSelect;
export type SessionTransaction = typeof sessionTransactions.$inferSelect;
export type UsageLog = typeof usageLogs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertPracticeNote = z.infer<typeof insertPracticeNoteSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertSessionBalance = z.infer<typeof insertSessionBalanceSchema>;
export type InsertSessionTransaction = z.infer<typeof insertSessionTransactionSchema>;