import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Scan jobs for security tools
export const scanJobs = sqliteTable("scan_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tool: text("tool").notNull(), // nmap | nikto | golismero | bdfproxy
  target: text("target").notNull(),
  status: text("status").notNull().default("queued"), // queued | running | completed | failed
  output: text("output").default(""),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

// AI chat messages
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  role: text("role").notNull(), // user | assistant | system
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

// System logs / events
export const systemLogs = sqliteTable("system_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  level: text("level").notNull(), // info | warn | error | critical
  source: text("source").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

// Service status tracking
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  status: text("status").notNull().default("offline"), // online | offline | degraded
  port: integer("port"),
  lastChecked: text("last_checked"),
});

export const insertScanJobSchema = createInsertSchema(scanJobs).omit({ id: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });
export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });

export type ScanJob = typeof scanJobs.$inferSelect;
export type InsertScanJob = z.infer<typeof insertScanJobSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
