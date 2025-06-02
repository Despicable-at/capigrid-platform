import {
  users,
  campaigns,
  contributions,
  campaignUpdates,
  campaignComments,
  adminCredentials,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type Contribution,
  type InsertContribution,
  type CampaignUpdate,
  type InsertCampaignUpdate,
  type CampaignComment,
  type InsertCampaignComment,
  type AdminCredential,
  type InsertAdminCredential,
} from "@shared/schema";
import { db } from "./db.js";
import { eq, desc, and, sql, ilike, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Campaign operations
  getCampaigns(filters?: { category?: string; fundingModel?: string; status?: string; featured?: boolean }): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignWithCreator(id: string): Promise<(Campaign & { creator: User }) | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  getUserCampaigns(userId: string): Promise<Campaign[]>;
  searchCampaigns(query: string): Promise<Campaign[]>;
  
  // Contribution operations
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getCampaignContributions(campaignId: string): Promise<Contribution[]>;
  getUserContributions(userId: string): Promise<Contribution[]>;
  updateCampaignAmount(campaignId: string, amount: string): Promise<void>;
  
  // Campaign updates
  createCampaignUpdate(update: InsertCampaignUpdate): Promise<CampaignUpdate>;
  getCampaignUpdates(campaignId: string): Promise<CampaignUpdate[]>;
  
  // Campaign comments
  createCampaignComment(comment: InsertCampaignComment): Promise<CampaignComment>;
  getCampaignComments(campaignId: string): Promise<(CampaignComment & { user: User | null })[]>;
  
  // Analytics
  getPlatformStats(): Promise<{
    totalRevenue: string;
    activeCampaigns: number;
    totalUsers: number;
    totalCampaigns: number;
  }>;
  
  getCampaignAnalytics(campaignId: string): Promise<{
    totalRaised: string;
    backersCount: number;
    avgContribution: string;
    dailyContributions: Array<{ date: string; amount: string; count: number }>;
  }>;
  
  // Admin operations
  getAdminByUsername(username: string): Promise<AdminCredential | undefined>;
  createAdmin(admin: InsertAdminCredential): Promise<AdminCredential>;
  updateAdminLastLogin(id: number): Promise<void>;
  
  // Campaign approval operations
  getPendingCampaigns(): Promise<Campaign[]>;
  approveCampaign(campaignId: string, adminId: number): Promise<void>;
  rejectCampaign(campaignId: string, adminId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Campaign operations
  async getCampaigns(
    filters?: { category?: string; fundingModel?: string; status?: string; featured?: boolean }
  ): Promise<Campaign[]> {
    // 1️⃣ Always show only approved, active campaigns:
    const conditions = [
      eq(campaigns.approved, true),
      eq(campaigns.status, "active"),
    ];

    // 2️⃣ If the caller passed any additional filters, push them:
    if (filters?.category) {
      conditions.push(eq(campaigns.category, filters.category));
    }
    if (filters?.fundingModel) {
      conditions.push(eq(campaigns.fundingModel, filters.fundingModel));
    }
    if (filters?.featured !== undefined) {
      conditions.push(eq(campaigns.featured, filters.featured));
    }

    // 3️⃣ Build one single Drizzle query that includes all conditions at once:
    return await db
      .select()
      .from(campaigns)
      .where(and(...conditions))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignWithCreator(id: string): Promise<(Campaign & { creator: User }) | undefined> {
    const [result] = await db
      .select()
      .from(campaigns)
      .innerJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(campaigns.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.campaigns,
      creator: result.users,
    };
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async searchCampaigns(query: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(
        or(
          ilike(campaigns.title, `%${query}%`),
          ilike(campaigns.description, `%${query}%`),
          ilike(campaigns.category, `%${query}%`)
        )
      )
      .orderBy(desc(campaigns.createdAt));
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Contribution operations
  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [newContribution] = await db
      .insert(contributions)
      .values(contribution)
      .returning();
    return newContribution;
  }

  async getCampaignContributions(campaignId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.campaignId, campaignId))
      .orderBy(desc(contributions.createdAt));
  }

  async getUserContributions(userId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.contributorId, userId))
      .orderBy(desc(contributions.createdAt));
  }

  async updateCampaignAmount(campaignId: string, amount: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ 
        currentAmount: sql`${campaigns.currentAmount} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId));
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Campaign updates
  async createCampaignUpdate(update: InsertCampaignUpdate): Promise<CampaignUpdate> {
    const [newUpdate] = await db
      .insert(campaignUpdates)
      .values(update)
      .returning();
    return newUpdate;
  }

  async getCampaignUpdates(campaignId: string): Promise<CampaignUpdate[]> {
    return await db
      .select()
      .from(campaignUpdates)
      .where(eq(campaignUpdates.campaignId, campaignId))
      .orderBy(desc(campaignUpdates.createdAt));
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Campaign comments
  async createCampaignComment(comment: InsertCampaignComment): Promise<CampaignComment> {
    const [newComment] = await db
      .insert(campaignComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getCampaignComments(campaignId: string): Promise<(CampaignComment & { user: User | null })[]> {
    const results = await db
      .select()
      .from(campaignComments)
      .leftJoin(users, eq(campaignComments.userId, users.id))
      .where(eq(campaignComments.campaignId, campaignId))
      .orderBy(desc(campaignComments.createdAt));
    
    return results.map(result => ({
      ...result.campaign_comments,
      user: result.users,
    }));
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Analytics
  async getPlatformStats(): Promise<{
    totalRevenue: string;
    activeCampaigns: number;
    totalUsers: number;
    totalCampaigns: number;
  }> {
    const [revenueResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${contributions.amount}), 0)` 
      })
      .from(contributions)
      .where(eq(contributions.status, "completed"));

    const [campaignsResult] = await db
      .select({ 
        active: sql<number>`COUNT(*) FILTER (WHERE ${campaigns.status} = 'active')`,
        total: sql<number>`COUNT(*)`
      })
      .from(campaigns);

    const [usersResult] = await db
      .select({ 
        total: sql<number>`COUNT(*)` 
      })
      .from(users);

    return {
      totalRevenue: revenueResult?.total || "0",
      activeCampaigns: campaignsResult?.active || 0,
      totalUsers: usersResult?.total || 0,
      totalCampaigns: campaignsResult?.total || 0,
    };
  }

  async getCampaignAnalytics(campaignId: string): Promise<{
    totalRaised: string;
    backersCount: number;
    avgContribution: string;
    dailyContributions: Array<{ date: string; amount: string; count: number }>;
  }> {
    const [statsResult] = await db
      .select({
        totalRaised: sql<string>`COALESCE(SUM(${contributions.amount}), 0)`,
        backersCount: sql<number>`COUNT(DISTINCT ${contributions.contributorId})`,
        avgContribution: sql<string>`COALESCE(AVG(${contributions.amount}), 0)`,
      })
      .from(contributions)
      .where(and(
        eq(contributions.campaignId, campaignId),
        eq(contributions.status, "completed")
      ));

    const dailyResults = await db
      .select({
        date: sql<string>`DATE(${contributions.createdAt})`,
        amount: sql<string>`SUM(${contributions.amount})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(contributions)
      .where(and(
        eq(contributions.campaignId, campaignId),
        eq(contributions.status, "completed")
      ))
      .groupBy(sql`DATE(${contributions.createdAt})`)
      .orderBy(sql`DATE(${contributions.createdAt})`);

    return {
      totalRaised: statsResult?.totalRaised || "0",
      backersCount: statsResult?.backersCount || 0,
      avgContribution: statsResult?.avgContribution || "0",
      dailyContributions: dailyResults,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Admin operations
  async getAdminByUsername(username: string): Promise<AdminCredential | undefined> {
    const [admin] = await db.select().from(adminCredentials).where(eq(adminCredentials.username, username));
    return admin;
  }

  async createAdmin(admin: InsertAdminCredential): Promise<AdminCredential> {
    const [newAdmin] = await db
      .insert(adminCredentials)
      .values(admin)
      .returning();
    return newAdmin;
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    await db
      .update(adminCredentials)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminCredentials.id, id));
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Campaign approval operations
  async getPendingCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "pending"))
      .orderBy(desc(campaigns.createdAt));
  }

  async approveCampaign(campaignId: string, adminId: number): Promise<void> {
    await db
      .update(campaigns)
      .set({
        approved: true,
        status: "active",
        approvedAt: new Date(),
        approvedBy: adminId.toString(),
      })
      .where(eq(campaigns.id, campaignId));
  }

  async rejectCampaign(campaignId: string, adminId: number): Promise<void> {
    await db
      .update(campaigns)
      .set({
        approved: false,
        status: "rejected",
        approvedBy: adminId.toString(),
      })
      .where(eq(campaigns.id, campaignId));
  }
}

export const storage = new DatabaseStorage();
