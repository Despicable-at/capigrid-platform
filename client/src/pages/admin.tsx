import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AnalyticsChart from "@/components/analytics-chart";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { 
  Shield, 
  Users, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Ban,
  RefreshCw
} from "lucide-react";

export default function Admin() {
  const { isAdmin, isLoading } = useAdminAuth();
  const { toast } = useToast();

  // Redirect to admin login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 500);
      return;
    }
  }, [isAdmin, isLoading, toast]);

  const { data: platformStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === "admin",
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin session expired. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: allCampaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null; // Will redirect
  }

  // Calculate additional stats
  const activeCampaigns = allCampaigns.filter((c: any) => c.status === "active").length;
  const pendingCampaigns = allCampaigns.filter((c: any) => c.status === "pending").length;
  const featuredCampaigns = allCampaigns.filter((c: any) => c.featured).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Admin Panel</h1>
            <p className="text-neutral-600">
              Comprehensive platform management with enhanced security features and analytics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Secure Access
            </Badge>
            <Badge variant="outline">
              {user.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
            </Badge>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="admin-card border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Platform Revenue</p>
                  <p className="text-2xl font-bold text-green-800">
                    ${parseFloat(platformStats?.totalRevenue || "0").toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-white text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-green-600 font-medium">+15.3%</span>
                <span className="text-sm text-green-600 ml-2">this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Active Campaigns</p>
                  <p className="text-2xl font-bold text-blue-800">{activeCampaigns}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-white text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-blue-600 font-medium">{pendingCampaigns} pending review</span>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">Total Users</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {platformStats?.totalUsers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="text-white text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-purple-600 font-medium">1,234 new users</span>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Security Status</p>
                  <p className="text-lg font-bold text-green-600">All Systems Secure</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-white text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-green-600 font-medium">2FA Active</span>
                <span className="mx-2 text-gray-500">•</span>
                <span className="text-sm text-green-600 font-medium">IP Protected</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AnalyticsChart
                  data={[
                    { date: "2024-01-01", amount: "15000", count: 45 },
                    { date: "2024-01-02", amount: "18000", count: 52 },
                    { date: "2024-01-03", amount: "22000", count: 68 },
                    { date: "2024-01-04", amount: "25000", count: 71 },
                    { date: "2024-01-05", amount: "28000", count: 89 },
                    { date: "2024-01-06", amount: "32000", count: 95 },
                    { date: "2024-01-07", amount: "35000", count: 112 },
                  ]}
                  title="Platform Revenue Analytics"
                />
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-neutral-600">API Status</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">Operational</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-neutral-600">Database</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">Healthy</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-neutral-600">Payments</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">Active</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-neutral-600">Monitoring</span>
                      </div>
                      <span className="text-sm font-medium text-yellow-600">Active</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Eye className="mr-2 h-4 w-4" />
                      Review Pending Campaigns
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generate Reports
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Emergency Lockdown
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Campaign Management</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{activeCampaigns} Active</Badge>
                    <Badge variant="outline">{pendingCampaigns} Pending</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">{featuredCampaigns} Featured</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allCampaigns.slice(0, 10).map((campaign: any) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{campaign.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {campaign.fundingModel}
                          </Badge>
                          <Badge 
                            variant={campaign.status === "active" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {campaign.status}
                          </Badge>
                          {campaign.featured && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-sm font-medium">
                          ${parseFloat(campaign.currentAmount || "0").toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-500">
                          of ${parseFloat(campaign.targetAmount).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Ban className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">User Management</h3>
                  <p className="text-neutral-600">
                    User management interface would be implemented here with user listing, role management, and moderation tools.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="2fa" className="text-sm font-medium">Two-Factor Authentication</Label>
                      <p className="text-xs text-neutral-500">Require 2FA for all admin accounts</p>
                    </div>
                    <Switch id="2fa" checked disabled />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ip-allow" className="text-sm font-medium">IP Allowlisting</Label>
                      <p className="text-xs text-neutral-500">Restrict admin access to specific IPs</p>
                    </div>
                    <Switch id="ip-allow" checked disabled />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="rate-limit" className="text-sm font-medium">Rate Limiting</Label>
                      <p className="text-xs text-neutral-500">Protect against brute force attacks</p>
                    </div>
                    <Switch id="rate-limit" checked disabled />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audit-log" className="text-sm font-medium">Audit Logging</Label>
                      <p className="text-xs text-neutral-500">Log all administrative actions</p>
                    </div>
                    <Switch id="audit-log" checked disabled />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Successful admin login</p>
                        <p className="text-xs text-neutral-500">2 minutes ago • IP: 192.168.1.1</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">2FA verification completed</p>
                        <p className="text-xs text-neutral-500">5 minutes ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Failed login attempt blocked</p>
                        <p className="text-xs text-neutral-500">1 hour ago • IP: 203.0.113.1</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Campaign approved</p>
                        <p className="text-xs text-neutral-500">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">Platform Configuration</h3>
                  <p className="text-neutral-600">
                    Platform settings interface would be implemented here with configuration options for fees, limits, and platform behavior.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
