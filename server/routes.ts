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
  // Auth middleware
  await setupAuth(app);

  // Auth routes
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

  // Campaign routes
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

  // Contribution routes
  app.post('/api/campaigns/:id/contribute', async (req, res) => {
    try {
      const contributionData = insertContributionSchema.parse({
        ...req.body,
        campaignId: req.params.id,
      });
      
      const contribution = await storage.createContribution(contributionData);
      
      // Update campaign amount
      await storage.updateCampaignAmount(req.params.id, contributionData.amount);
      
      res.status(201).json(contribution);
    } catch (error) {
      console.error("Error creating contribution:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contribution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  app.get('/api/campaigns/:id/contributions', async (req, res) => {
    try {
      const contributions = await storage.getCampaignContributions(req.params.id);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.get('/api/users/contributions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contributions = await storage.getUserContributions(userId);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching user contributions:", error);
      res.status(500).json({ message: "Failed to fetch user contributions" });
    }
  });

  // Campaign updates routes
  app.post('/api/campaigns/:id/updates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user owns the campaign
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign || campaign.creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this campaign" });
      }
      
      const updateData = insertCampaignUpdateSchema.parse({
        ...req.body,
        campaignId: req.params.id,
      });
      
      const update = await storage.createCampaignUpdate(updateData);
      res.status(201).json(update);
    } catch (error) {
      console.error("Error creating campaign update:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign update" });
    }
  });

  app.get('/api/campaigns/:id/updates', async (req, res) => {
    try {
      const updates = await storage.getCampaignUpdates(req.params.id);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching campaign updates:", error);
      res.status(500).json({ message: "Failed to fetch campaign updates" });
    }
  });

  // Campaign comments routes
  app.post('/api/campaigns/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertCampaignCommentSchema.parse({
        ...req.body,
        campaignId: req.params.id,
        userId,
      });
      
      const comment = await storage.createCampaignComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/campaigns/:id/comments', async (req, res) => {
    try {
      const comments = await storage.getCampaignComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Analytics routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  app.get('/api/campaigns/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user owns the campaign or is admin
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign || (campaign.creatorId !== userId && user?.role !== 'admin')) {
        return res.status(403).json({ message: "Not authorized to view analytics for this campaign" });
      }
      
      const analytics = await storage.getCampaignAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ message: "Failed to fetch campaign analytics" });
    }
  });

  // Payment processing routes
  app.post('/api/payments/initialize', async (req, res) => {
    try {
      const { amount, email, campaignId } = req.body;
      
      if (!amount || !email || !campaignId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Initialize Paystack payment
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackKey) {
        return res.status(500).json({ message: "Payment service not configured" });
      }

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100), // Convert to kobo
          email,
          callback_url: `${process.env.BASE_URL || 'http://localhost:5000'}/campaigns/${campaignId}`,
          metadata: {
            campaignId,
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ message: data.message || "Payment initialization failed" });
      }

      res.json(data);
    } catch (error) {
      console.error("Error initializing payment:", error);
      res.status(500).json({ message: "Failed to initialize payment" });
    }
  });

  app.post('/api/payments/verify', async (req, res) => {
    try {
      const { reference } = req.body;
      
      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackKey) {
        return res.status(500).json({ message: "Payment service not configured" });
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${paystackKey}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok || data.data.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed" });
      }

      // Create contribution record
      const contributionData = {
        campaignId: data.data.metadata.campaignId,
        amount: (data.data.amount / 100).toString(), // Convert from kobo
        paymentMethod: 'card',
        paymentId: reference,
        contributorEmail: data.data.customer.email,
        status: 'completed' as const,
      };

      const contribution = await storage.createContribution(contributionData);
      await storage.updateCampaignAmount(contributionData.campaignId, contributionData.amount);

      res.json({ contribution, payment: data.data });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Admin authentication routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password, twoFactorCode } = adminLoginSchema.parse(req.body);
      
      const admin = await storage.getAdminByUsername(username);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check 2FA if enabled and code is provided
      if (admin.twoFactorSecret && twoFactorCode) {
        const verified = speakeasy.totp.verify({
          secret: admin.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 2
        });

        if (!verified) {
          return res.status(401).json({ message: "Invalid two-factor authentication code" });
        }
      }

      // Update last login
      await storage.updateAdminLastLogin(admin.id);

      // Set admin session
      (req.session as any).adminId = admin.id;
      (req.session as any).isAdmin = true;

      res.json({ 
        message: "Login successful", 
        admin: { 
          id: admin.id, 
          username: admin.username, 
          email: admin.email 
        } 
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Admin middleware
  const isAdmin = (req: any, res: any, next: any) => {
    if (!(req.session as any).isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

  app.get('/api/admin/check', isAdmin, (req, res) => {
    res.json({ isAdmin: true });
  });

  // Admin campaign management routes
  app.get('/api/admin/campaigns/pending', isAdmin, async (req, res) => {
    try {
      const pendingCampaigns = await storage.getPendingCampaigns();
      res.json(pendingCampaigns);
    } catch (error) {
      console.error("Error fetching pending campaigns:", error);
      res.status(500).json({ message: "Failed to fetch pending campaigns" });
    }
  });

  app.post('/api/admin/campaigns/:id/approve', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.session.adminId;
      
      await storage.approveCampaign(id, adminId);
      res.json({ message: "Campaign approved successfully" });
    } catch (error) {
      console.error("Error approving campaign:", error);
      res.status(500).json({ message: "Failed to approve campaign" });
    }
  });

  app.post('/api/admin/campaigns/:id/reject', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.session.adminId;
      
      await storage.rejectCampaign(id, adminId);
      res.json({ message: "Campaign rejected successfully" });
    } catch (error) {
      console.error("Error rejecting campaign:", error);
      res.status(500).json({ message: "Failed to reject campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
