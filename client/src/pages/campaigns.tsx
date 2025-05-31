import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import CampaignCard from "@/components/campaign-card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Search, Filter, Grid, List } from "lucide-react";

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fundingModelFilter, setFundingModelFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", { 
      category: categoryFilter, 
      fundingModel: fundingModelFilter,
      search: searchQuery 
    }],
    queryFn: async () => {
      let url = "/api/campaigns";
      const params = new URLSearchParams();
      
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (fundingModelFilter && fundingModelFilter !== "all") params.append("fundingModel", fundingModelFilter);
      if (searchQuery) {
        url = "/api/campaigns/search";
        params.append("q", searchQuery);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Query will be refetched automatically due to searchQuery dependency
  };

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
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Discover Campaigns</h1>
          <p className="text-neutral-600">
            Explore innovative projects across all funding models and categories.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-5 w-5" />
              <Input
                placeholder="Search campaigns, creators, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </form>
          
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <Select value={fundingModelFilter} onValueChange={setFundingModelFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Funding Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                  <SelectItem value="rewards">Rewards</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="social">Social Impact</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || categoryFilter || fundingModelFilter) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setFundingModelFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || categoryFilter || fundingModelFilter) && (
          <div className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">
                  Search: {searchQuery}
                </Badge>
              )}
              {fundingModelFilter && (
                <Badge variant="secondary" className={fundingModelColors[fundingModelFilter as keyof typeof fundingModelColors]}>
                  {fundingModelFilter.charAt(0).toUpperCase() + fundingModelFilter.slice(1)}
                </Badge>
              )}
              {categoryFilter && (
                <Badge variant="secondary">
                  {categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading campaigns...</p>
          </div>
        ) : campaigns.length > 0 ? (
          <>
            <div className="mb-6 text-sm text-neutral-600">
              Found {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
            </div>
            
            <div className={
              viewMode === "grid" 
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-6"
            }>
              {campaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign} 
                  variant={viewMode}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No campaigns found</h3>
            <p className="text-neutral-600 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("");
                setFundingModelFilter("");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
