import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Campaign, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CampaignCard from "@/components/campaign-card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ArrowRight,
  BarChart3
} from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  const { data: recentCampaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: userContributions = [] } = useQuery({
    queryKey: ["/api/users/contributions"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const totalRaised = userCampaigns.reduce((sum, campaign) => 
    sum + parseFloat(campaign.currentAmount || "0"), 0
  );

  const totalContributed = userContributions.reduce((sum: number, contribution: any) => 
    sum + parseFloat(contribution.amount || "0"), 0
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            Welcome back, {user?.firstName || "Creator"}!
          </h1>
          <p className="text-neutral-600">
            Manage your campaigns, track contributions, and explore new opportunities.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">My Campaigns</p>
                  <p className="text-2xl font-bold text-neutral-800">{userCampaigns.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total Raised</p>
                  <p className="text-2xl font-bold text-neutral-800">${totalRaised.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <DollarSign className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Contributed</p>
                  <p className="text-2xl font-bold text-neutral-800">${totalContributed.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                  <Users className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Backed Projects</p>
                  <p className="text-2xl font-bold text-neutral-800">{userContributions.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <Button 
                className="flex items-center justify-center space-x-2"
                onClick={() => window.location.href = "/create-campaign"}
              >
                <Plus className="h-4 w-4" />
                <span>Create Campaign</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/campaigns"}
              >
                Browse Projects
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/dashboard"}
              >
                View Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">System Status</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Payments</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Support</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Available
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Campaigns */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">My Campaigns</h2>
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => window.location.href = "/dashboard"}
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          {userCampaigns.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCampaigns.slice(0, 3).map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
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
        </section>

        {/* Recent Campaigns */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">Discover New Projects</h2>
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => window.location.href = "/campaigns"}
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCampaigns.slice(0, 3).map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
