import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CampaignCard from "@/components/campaign-card";
import AnalyticsChart from "@/components/analytics-chart";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Share2
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("30d");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: userCampaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/users/campaigns"],
    enabled: isAuthenticated,
  });

  const { data: userContributions = [] } = useQuery({
    queryKey: ["/api/users/contributions"],
    enabled: isAuthenticated,
  });

  // Get analytics for the first campaign (demo)
  const { data: campaignAnalytics } = useQuery({
    queryKey: ["/api/campaigns", userCampaigns[0]?.id, "analytics"],
    enabled: isAuthenticated && userCampaigns.length > 0,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Calculate stats
  const totalRaised = userCampaigns.reduce((sum, campaign) => 
    sum + parseFloat(campaign.currentAmount || "0"), 0
  );

  const activeCampaigns = userCampaigns.filter(c => c.status === "active").length;
  const totalContributed = userContributions.reduce((sum: number, contribution: any) => 
    sum + parseFloat(contribution.amount || "0"), 0
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Dashboard</h1>
            <p className="text-neutral-600">
              Track your campaigns, analyze performance, and manage your fundraising activities.
            </p>
          </div>
          <Button onClick={() => window.location.href = "/create-campaign"}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total Raised</p>
                  <p className="text-2xl font-bold text-neutral-800">${totalRaised.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-green-600 text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-green-600 font-medium">+12.5%</span>
                <span className="text-sm text-neutral-500 ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-neutral-800">{activeCampaigns}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-primary text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-primary font-medium">{userCampaigns.length} total</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total Backers</p>
                  <p className="text-2xl font-bold text-neutral-800">
                    {campaignAnalytics?.backersCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="text-blue-600 text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-blue-600 font-medium">+8.2%</span>
                <span className="text-sm text-neutral-500 ml-2">new this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Avg. Contribution</p>
                  <p className="text-2xl font-bold text-neutral-800">
                    ${parseFloat(campaignAnalytics?.avgContribution || "0").toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-orange-600 text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-orange-600 font-medium">+5.1%</span>
                <span className="text-sm text-neutral-500 ml-2">improvement</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="contributions">My Contributions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            {userCampaigns.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Your Campaigns</h2>
                  <Badge variant="secondary">
                    {activeCampaigns} active • {userCampaigns.length} total
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCampaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">No campaigns yet</h3>
                  <p className="text-neutral-600 mb-4">Start your first campaign and reach your funding goals.</p>
                  <Button onClick={() => window.location.href = "/create-campaign"}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AnalyticsChart
                  data={campaignAnalytics?.dailyContributions || []}
                  title="Funding Progress"
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-600">Total Views</span>
                      </div>
                      <span className="font-semibold">2,847</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-600">Likes</span>
                      </div>
                      <span className="font-semibold">341</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-600">Shares</span>
                      </div>
                      <span className="font-semibold">89</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-600">Comments</span>
                      </div>
                      <span className="font-semibold">24</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Post Update
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Campaign
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Detailed Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                {userContributions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-neutral-600 mb-4">
                      You've contributed to {userContributions.length} project{userContributions.length !== 1 ? 's' : ''} 
                      with a total of ${totalContributed.toLocaleString()}
                    </div>
                    {userContributions.slice(0, 5).map((contribution: any) => (
                      <div key={contribution.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Campaign Contribution</p>
                          <p className="text-sm text-neutral-600">
                            {new Date(contribution.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          ${parseFloat(contribution.amount).toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-800 mb-2">No contributions yet</h3>
                    <p className="text-neutral-600 mb-4">Start supporting amazing projects on CapiGrid.</p>
                    <Button onClick={() => window.location.href = "/campaigns"}>
                      Explore Campaigns
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800">New contribution received</p>
                      <p className="text-xs text-neutral-500">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800">Campaign update posted</p>
                      <p className="text-xs text-neutral-500">1 day ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800">Campaign reached 50% funding</p>
                      <p className="text-xs text-neutral-500">3 days ago</p>
                    </div>
                  </div>
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
