import { Campaign } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  Star, 
  Calendar, 
  Users, 
  TrendingUp,
  DollarSign 
} from "lucide-react";
import { format } from "date-fns";

interface CampaignCardProps {
  campaign: Campaign;
  variant?: "grid" | "list";
}

export default function CampaignCard({ campaign, variant = "grid" }: CampaignCardProps) {
  const progressPercentage = campaign.targetAmount ? 
    (parseFloat(campaign.currentAmount || "0") / parseFloat(campaign.targetAmount)) * 100 : 0;

  const fundingModelColors = {
    donation: "bg-blue-100 text-blue-800 border-blue-200",
    rewards: "bg-green-100 text-green-800 border-green-200",
    equity: "bg-orange-100 text-orange-800 border-orange-200",
    debt: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const fundingModelIcons = {
    donation: Heart,
    rewards: Users,
    equity: TrendingUp,
    debt: DollarSign,
  };

  const Icon = fundingModelIcons[campaign.fundingModel as keyof typeof fundingModelIcons] || Heart;

  const daysLeft = campaign.endDate ? 
    Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : 
    null;

  if (variant === "list") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow card-hover">
        <div className="flex">
          {campaign.imageUrl && (
            <div className="w-48 h-32 flex-shrink-0">
              <img 
                src={campaign.imageUrl} 
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={fundingModelColors[campaign.fundingModel as keyof typeof fundingModelColors]}>
                    <Icon className="w-3 h-3 mr-1" />
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
                
                <h3 className="text-xl font-bold text-neutral-800 mb-2 hover:text-primary cursor-pointer">
                  <a href={`/campaigns/${campaign.id}`}>{campaign.title}</a>
                </h3>
                
                <p className="text-neutral-600 mb-4 line-clamp-2">
                  {campaign.shortDescription || campaign.description.substring(0, 150) + "..."}
                </p>
              </div>
              
              <div className="ml-6 text-right">
                <Button 
                  onClick={() => window.location.href = `/campaigns/${campaign.id}`}
                  className="mb-2"
                >
                  View Details
                </Button>
                <div className="text-sm text-neutral-500">
                  {daysLeft !== null ? `${daysLeft} days left` : "No end date"}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-neutral-600">Raised</p>
                <p className="font-bold text-neutral-800">
                  ${parseFloat(campaign.currentAmount || "0").toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Goal</p>
                <p className="font-bold text-neutral-800">
                  ${parseFloat(campaign.targetAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Progress</p>
                <p className="font-bold text-neutral-800">{Math.round(progressPercentage)}%</p>
              </div>
            </div>
            
            <Progress value={Math.min(progressPercentage, 100)} className="mt-3 h-2" />
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow card-hover">
      {campaign.imageUrl && (
        <div className="relative">
          <img 
            src={campaign.imageUrl} 
            alt={campaign.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className={fundingModelColors[campaign.fundingModel as keyof typeof fundingModelColors]}>
              <Icon className="w-3 h-3 mr-1" />
              {campaign.fundingModel.charAt(0).toUpperCase() + campaign.fundingModel.slice(1)}
            </Badge>
            {campaign.featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <CardContent className="p-6">
        {!campaign.imageUrl && (
          <div className="flex items-center gap-2 mb-3">
            <Badge className={fundingModelColors[campaign.fundingModel as keyof typeof fundingModelColors]}>
              <Icon className="w-3 h-3 mr-1" />
              {campaign.fundingModel.charAt(0).toUpperCase() + campaign.fundingModel.slice(1)}
            </Badge>
            {campaign.featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        )}
        
        <h3 className="text-xl font-bold text-neutral-800 mb-2 hover:text-primary cursor-pointer">
          <a href={`/campaigns/${campaign.id}`}>{campaign.title}</a>
        </h3>
        
        <p className="text-neutral-600 mb-4 line-clamp-3">
          {campaign.shortDescription || campaign.description.substring(0, 120) + "..."}
        </p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>${parseFloat(campaign.currentAmount || "0").toLocaleString()}</span>
            <span>${parseFloat(campaign.targetAmount).toLocaleString()}</span>
          </div>
          <Progress value={Math.min(progressPercentage, 100)} className="h-2 progress-bar" />
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>{Math.round(progressPercentage)}% funded</span>
            <span>{daysLeft !== null ? `${daysLeft} days left` : "No deadline"}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-neutral-600">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarFallback className="text-xs">
                {campaign.creatorId.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>by Creator</span>
          </div>
          
          <Button 
            size="sm"
            onClick={() => window.location.href = `/campaigns/${campaign.id}`}
            className={`
              ${campaign.fundingModel === "donation" ? "bg-blue-600 hover:bg-blue-700" :
                campaign.fundingModel === "rewards" ? "bg-green-600 hover:bg-green-700" :
                campaign.fundingModel === "equity" ? "bg-orange-600 hover:bg-orange-700" :
                "bg-purple-600 hover:bg-purple-700"}
            `}
          >
            {campaign.fundingModel === "donation" ? "Donate" :
             campaign.fundingModel === "rewards" ? "Back Now" :
             campaign.fundingModel === "equity" ? "Invest" :
             "Fund Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
