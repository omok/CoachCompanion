import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'coach' or 'parent'
  name: text("name").notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  coachId: integer("coach_id").notNull(),
  description: text("description"),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: integer("team_id").notNull(),
  parentId: integer("parent_id").notNull(),
  active: boolean("active").notNull().default(true),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  teamId: integer("team_id").notNull(),
  date: timestamp("date").notNull(),
  present: boolean("present").notNull(),
});

export const practiceNotes = pgTable("practice_notes", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  coachId: integer("coach_id").notNull(),
  practiceDate: timestamp("practice_date").notNull(),
  notes: text("notes").notNull(),
  playerIds: integer("player_ids").array(), // Store player IDs instead of tags
});

export const insertUserSchema = createInsertSchema(users);
export const insertTeamSchema = createInsertSchema(teams);
export const insertPlayerSchema = createInsertSchema(players);
export const insertAttendanceSchema = createInsertSchema(attendance);
export const insertPracticeNoteSchema = createInsertSchema(practiceNotes);

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type PracticeNote = typeof practiceNotes.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertPracticeNote = z.infer<typeof insertPracticeNoteSchema>;