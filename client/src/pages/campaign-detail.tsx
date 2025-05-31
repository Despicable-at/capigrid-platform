import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Campaign, User, CampaignUpdate, CampaignComment } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PaymentForm from "@/components/payment-form";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { 
  Heart, 
  Share2, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  TrendingUp,
  MessageCircle,
  Bell,
  Star
} from "lucide-react";
import { format } from "date-fns";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newComment, setNewComment] = useState("");

  const { data: campaign, isLoading } = useQuery<Campaign & { creator: User }>({
    queryKey: ["/api/campaigns", id],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${id}`);
      if (!response.ok) {
        throw new Error("Campaign not found");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: updates = [] } = useQuery<CampaignUpdate[]>({
    queryKey: ["/api/campaigns", id, "updates"],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${id}/updates`);
      if (!response.ok) {
        throw new Error("Failed to fetch updates");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: comments = [] } = useQuery<(CampaignComment & { user: User | null })[]>({
    queryKey: ["/api/campaigns", id, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${id}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/campaigns/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to post comment");
      }
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id, "comments"] });
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
    try {
      await navigator.share({
        title: campaign?.title,
        text: campaign?.shortDescription,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Campaign link copied to clipboard!",
      });
    }
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to post a comment.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    commentMutation.mutate(newComment);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">Campaign Not Found</h1>
            <p className="text-neutral-600 mb-8">The campaign you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => window.location.href = "/campaigns"}>
              Browse Campaigns
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = campaign.targetAmount ? 
    (parseFloat(campaign.currentAmount || "0") / parseFloat(campaign.targetAmount)) * 100 : 0;

  const fundingModelColors = {
    donation: "bg-blue-100 text-blue-800",
    rewards: "bg-green-100 text-green-800",
    equity: "bg-orange-100 text-orange-800",
    debt: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge className={fundingModelColors[campaign.fundingModel as keyof typeof fundingModelColors]}>
              {campaign.fundingModel.charAt(0).toUpperCase() + campaign.fundingModel.slice(1)}
            </Badge>
            {campaign.featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {campaign.category && (
              <Badge variant="outline">
                {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)}
              </Badge>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">{campaign.title}</h1>
          <p className="text-xl text-neutral-600 mb-6">{campaign.shortDescription}</p>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={campaign.creator.profileImageUrl || undefined} />
                <AvatarFallback>
                  {campaign.creator.firstName?.[0]}{campaign.creator.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-neutral-800">
                  {campaign.creator.firstName} {campaign.creator.lastName}
                </p>
                <p className="text-sm text-neutral-600">Campaign Creator</p>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-12" />
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {campaign.endDate && (
                <div className="flex items-center text-sm text-neutral-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  Ends {format(new Date(campaign.endDate), "MMM d, yyyy")}
                </div>
              )}
            </div>
          </div>

          {campaign.imageUrl && (
            <img 
              src={campaign.imageUrl} 
              alt={campaign.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
                <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="prose max-w-none">
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                        {campaign.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="updates" className="mt-6">
                <div className="space-y-6">
                  {updates.length > 0 ? (
                    updates.map((update) => (
                      <Card key={update.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{update.title}</CardTitle>
                            <span className="text-sm text-neutral-500">
                              {format(new Date(update.createdAt!), "MMM d, yyyy")}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-neutral-700 whitespace-pre-line">{update.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Bell className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">No updates yet</h3>
                        <p className="text-neutral-600">The campaign creator hasn't posted any updates.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="comments" className="mt-6">
                <div className="space-y-6">
                  {/* Comment Form */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Leave a Comment</h3>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Share your thoughts about this campaign..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />
                        <Button 
                          onClick={handleComment}
                          disabled={commentMutation.isPending || !newComment.trim()}
                        >
                          {commentMutation.isPending ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments List */}
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <Card key={comment.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {comment.user?.firstName?.[0] || "A"}
                                {comment.user?.lastName?.[0] || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-neutral-800">
                                  {comment.user?.firstName} {comment.user?.lastName || "Anonymous"}
                                </span>
                                <span className="text-sm text-neutral-500">
                                  {format(new Date(comment.createdAt!), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                              <p className="text-neutral-700">{comment.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <MessageCircle className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">No comments yet</h3>
                        <p className="text-neutral-600">Be the first to share your thoughts!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="rewards" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {campaign.fundingModel === "rewards" && campaign.rewards ? (
                      <div className="space-y-4">
                        <h3 className="font-semibold mb-4">Reward Tiers</h3>
                        {/* Render rewards from campaign.rewards JSON */}
                        <p className="text-neutral-600">Rewards information would be displayed here based on the campaign's reward structure.</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Gift className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">No rewards</h3>
                        <p className="text-neutral-600">
                          This {campaign.fundingModel} campaign doesn't offer specific rewards.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-neutral-600">Raised</p>
                      <p className="text-3xl font-bold text-neutral-800">
                        ${parseFloat(campaign.currentAmount || "0").toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-600">Goal</p>
                      <p className="text-lg font-semibold text-neutral-800">
                        ${parseFloat(campaign.targetAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={Math.min(progressPercentage, 100)} className="h-3" />
                  
                  <div className="flex justify-between text-sm text-neutral-600">
                    <span>{Math.round(progressPercentage)}% funded</span>
                    <span>{campaign.endDate ? 
                      `${Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} days left` :
                      "No end date"
                    }</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {campaign.fundingModel === "donation" ? "Donate Now" :
                     campaign.fundingModel === "rewards" ? "Back This Project" :
                     campaign.fundingModel === "equity" ? "Invest Now" :
                     "Fund This Project"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-600">Backers</span>
                  </div>
                  <span className="font-semibold">Loading...</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-600">Progress</span>
                  </div>
                  <span className="font-semibold">{Math.round(progressPercentage)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-600">Created</span>
                  </div>
                  <span className="font-semibold">
                    {format(new Date(campaign.createdAt!), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Creator Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={campaign.creator.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {campaign.creator.firstName?.[0]}{campaign.creator.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-neutral-800">
                      {campaign.creator.firstName} {campaign.creator.lastName}
                    </p>
                    <p className="text-sm text-neutral-600">{campaign.creator.email}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600">
                  Member since {format(new Date(campaign.creator.createdAt!), "MMMM yyyy")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentForm && (
        <PaymentForm
          campaign={campaign}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={() => {
            setShowPaymentForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id] });
          }}
        />
      )}

      <Footer />
    </div>
  );
}
