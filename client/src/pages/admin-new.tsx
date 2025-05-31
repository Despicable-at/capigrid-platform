import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Campaign } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle,
  X,
  Clock,
  DollarSign,
  Eye,
  LogOut
} from "lucide-react";

export default function AdminPanel() {
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

  // Get pending campaigns for approval
  const { data: pendingCampaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns/pending"],
    enabled: isAdmin,
  });

  // Campaign approval mutation
  const approveMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to approve campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign approved",
        description: "The campaign has been approved and is now live.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve campaign",
        variant: "destructive",
      });
    },
  });

  // Campaign rejection mutation
  const rejectMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to reject campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign rejected",
        description: "The campaign has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject campaign",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-bold text-neutral-800">CapiGrid Admin Panel</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">Campaign Approval</h2>
          <p className="text-neutral-600">Review and approve new campaign submissions</p>
        </div>

        {/* Pending Campaigns Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-neutral-800">{pendingCampaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Campaign Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-neutral-600">Loading campaigns...</p>
              </div>
            ) : pendingCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">All caught up!</h3>
                <p className="text-neutral-600">No campaigns pending approval at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-neutral-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                          {campaign.title}
                        </h3>
                        <p className="text-neutral-600 mb-3 line-clamp-2">
                          {campaign.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{campaign.fundingModel}</Badge>
                          <Badge variant="outline">{campaign.category}</Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${Number(campaign.targetAmount).toLocaleString()}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500">
                          Submitted: {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {campaign.imageUrl && (
                        <div className="ml-6">
                          <img 
                            src={campaign.imageUrl} 
                            alt={campaign.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/campaigns/${campaign.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectMutation.mutate(campaign.id)}
                          disabled={rejectMutation.isPending || approveMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(campaign.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}