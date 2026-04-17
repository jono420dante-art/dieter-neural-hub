import {
  type ScanJob, type InsertScanJob, scanJobs,
  type ChatMessage, type InsertChatMessage, chatMessages,
  type SystemLog, type InsertSystemLog, systemLogs,
  type Service, type InsertService, services,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Scan jobs
  getScanJobs(): Promise<ScanJob[]>;
  getScanJob(id: number): Promise<ScanJob | undefined>;
  createScanJob(job: InsertScanJob): Promise<ScanJob>;
  updateScanJob(id: number, updates: Partial<ScanJob>): Promise<ScanJob | undefined>;

  // Chat
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;
  clearChat(): Promise<void>;

  // Logs
  getSystemLogs(limit?: number): Promise<SystemLog[]>;
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;

  // Services
  getServices(): Promise<Service[]>;
  upsertService(svc: InsertService): Promise<Service>;
}

export class DatabaseStorage implements IStorage {
  async getScanJobs(): Promise<ScanJob[]> {
    return db.select().from(scanJobs).orderBy(desc(scanJobs.id)).all();
  }

  async getScanJob(id: number): Promise<ScanJob | undefined> {
    return db.select().from(scanJobs).where(eq(scanJobs.id, id)).get();
  }

  async createScanJob(job: InsertScanJob): Promise<ScanJob> {
    return db.insert(scanJobs).values(job).returning().get();
  }

  async updateScanJob(id: number, updates: Partial<ScanJob>): Promise<ScanJob | undefined> {
    const existing = db.select().from(scanJobs).where(eq(scanJobs.id, id)).get();
    if (!existing) return undefined;
    return db.update(scanJobs).set(updates).where(eq(scanJobs.id, id)).returning().get();
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).orderBy(chatMessages.id).all();
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    return db.insert(chatMessages).values(msg).returning().get();
  }

  async clearChat(): Promise<void> {
    db.delete(chatMessages).run();
  }

  async getSystemLogs(limit = 100): Promise<SystemLog[]> {
    return db.select().from(systemLogs).orderBy(desc(systemLogs.id)).limit(limit).all();
  }

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    return db.insert(systemLogs).values(log).returning().get();
  }

  async getServices(): Promise<Service[]> {
    return db.select().from(services).all();
  }

  async upsertService(svc: InsertService): Promise<Service> {
    const existing = db.select().from(services).where(eq(services.name, svc.name)).get();
    if (existing) {
      return db.update(services).set(svc).where(eq(services.id, existing.id)).returning().get();
    }
    return db.insert(services).values(svc).returning().get();
  }
}

export const storage = new DatabaseStorage();
