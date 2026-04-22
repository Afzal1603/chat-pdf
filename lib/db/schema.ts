import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userSystemEnum = pgEnum("user_system_enum", [
  "user",
  "assistant",
  "system",
]);

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  pdfName: text("pdf_name").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  filekey: text("file_key").notNull(),
});
export type DrizzleChat = typeof chats.$inferSelect;
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  role: userSystemEnum("role").notNull(),
});

// ==================== RESEARCH MODE ====================

export const researchSessions = pgTable("research_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: text("title").notNull().default("Research Session"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type DrizzleResearchSession = typeof researchSessions.$inferSelect;

export const researchPdfs = pgTable("research_pdfs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => researchSessions.id)
    .notNull(),
  pdfName: text("pdf_name").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  filekey: text("file_key").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type DrizzleResearchPdf = typeof researchPdfs.$inferSelect;

export const researchMessages = pgTable("research_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => researchSessions.id)
    .notNull(),
  role: userSystemEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
