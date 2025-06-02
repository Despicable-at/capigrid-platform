import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated } from "./replitAuth.js";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import {
  adminLoginSchema,
  insertCampaignSchema,
  insertContributionSchema,
  insertCampaignUpdateSchema,
  insertCampaignCommentSchema,
} from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/campaigns', async (req, res) => {
    try {
      const { category, fundingModel, status, featured } = req.query;
      const campaigns = await storage.getCampaigns({
        category: category as string,
        fundingModel: fundingModel as string,
        status: status as string,
        featured: featured === 'true',
      });
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get('/api/campaigns/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const campaigns = await storage.searchCampaigns(q);
      res.json(campaigns);
    } catch (error) {
      console.error("Error searching campaigns:", error);
      res.status(500).json({ message: "Failed to search campaigns" });
    }
  });

  app.get('/api/campaigns/:id', async (req, res) => {
    try {
      const campaign = await storage.getCampaignWithCreator(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        creatorId: userId,
      });

      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/users/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getUserCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ message: "Failed to fetch user campaigns" });
    }
  });

  app.post('/api/campaigns/:id/contribute', async (req, res) => {
    try {
      const parsedData = insertContributionSchema.parse({
        ...req.body,
        campaignId: req.params.id,
      });

      const amount = typeof parsedData.amount === 'number'
        ? parsedData.amount.toString()
        : parsedData.amount;

      const contributionData = {
        ...parsedData,
        amount
      };

      const contribution = await storage.createContribution(contributionData);

      await storage.updateCampaignAmount(req.params.id, amount);

      res.status(201).json(contribution);
    } catch (error) {
      console.error("Error contributing:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contribution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to contribute to campaign" });
    }
  });

  app.post('/api/campaigns/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertCampaignCommentSchema.parse({
        ...req.body,
        campaignId: req.params.id,
        commenterId: userId,
      });

      const comment = await storage.createCampaignComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error commenting on campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to comment on campaign" });
    }
  });

  app.post('/api/campaigns/:id/updates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = insertCampaignUpdateSchema.parse({
        ...req.body,
        campaignId: req.params.id,
        updaterId: userId,
      });

      const update = await storage.createCampaignUpdate(updateData);
      res.status(201).json(update);
    } catch (error) {
      console.error("Error updating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password, otp } = adminLoginSchema.parse(req.body);

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const passwordValid = await bcrypt.compare(password, admin.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const otpValid = speakeasy.totp.verify({
        secret: admin.totpSecret,
        encoding: "base32",
        token: otp,
      });

      if (!otpValid) {
        return res.status(401).json({ message: "Invalid OTP" });
      }

      const token = await storage.createAdminSession(admin.id);
      res.json({ token });
    } catch (error) {
      console.error("Error logging in admin:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login admin" });
    }
  });

  return createServer(app);
}
