import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@shared/schema";
import CampaignCard from "@/components/campaign-card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { 
  Heart, 
  Gift, 
  TrendingUp, 
  Handshake,
  CreditCard,
  Shield,
  Users,
  BarChart3,
  Star,
  ArrowRight,
  Search
} from "lucide-react";
import { useState } from "react";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: featuredCampaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", { featured: true }],
    queryFn: async () => {
      const response = await fetch("/api/campaigns?featured=true");
      if (!response.ok) {
        throw new Error("Failed to fetch featured campaigns");
      }
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/campaigns?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Fund Your Dreams with <span className="text-yellow-300">Multiple Models</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Choose from Donation, Rewards, Equity, or Debt crowdfunding. Secure payments, blockchain integration, and powerful analytics all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-gray-100"
                  onClick={() => window.location.href = "/api/login"}
                >
                  Start Your Campaign
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-primary"
                  onClick={() => window.location.href = "/campaigns"}
                >
                  Explore Projects
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Crowdfunding community collaboration" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Crowdfunding Models */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-800 mb-4">Choose Your Funding Model</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              We support all major crowdfunding models to match your project's unique needs and goals.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
                  <Heart className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-4">Donation</h3>
                <p className="text-neutral-600 mb-6">No rewards, just pure support for causes and projects you believe in.</p>
                <Button variant="link" className="text-primary p-0">
                  Learn More <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-6">
                  <Gift className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-4">Rewards</h3>
                <p className="text-neutral-600 mb-6">Offer products, services, or perks in exchange for funding support.</p>
                <Button variant="link" className="text-secondary p-0">
                  Learn More <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-4">Equity</h3>
                <p className="text-neutral-600 mb-6">Offer ownership stakes in your company to qualified investors.</p>
                <Button variant="link" className="text-accent p-0">
                  Learn More <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Handshake className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-4">Debt</h3>
                <p className="text-neutral-600 mb-6">Borrow funds with clear repayment terms and interest rates.</p>
                <Button variant="link" className="text-purple-600 p-0">
                  Learn More <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-neutral-800 mb-4">Featured Campaigns</h2>
              <p className="text-xl text-neutral-600">Discover innovative projects seeking funding right now</p>
            </div>
            <Button variant="link" className="hidden md:flex items-center text-primary">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          {featuredCampaigns.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCampaigns.slice(0, 3).map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-600">No featured campaigns available at the moment.</p>
              <Button 
                className="mt-4" 
                onClick={() => window.location.href = "/campaigns"}
              >
                Browse All Campaigns
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Payment Integration */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-800 mb-4">Secure Payment Processing</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Accept payments through traditional methods and cutting-edge blockchain technology.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-800 mb-2">Paystack Integration</h3>
                  <p className="text-neutral-600">Secure, PCI-compliant payment processing for credit cards, bank transfers, and mobile money across Africa.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">₿</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-800 mb-2">Blockchain Payments</h3>
                  <p className="text-neutral-600">Accept cryptocurrency payments via MetaMask and Web3.js integration with Ethereum smart contracts.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-800 mb-2">Advanced Security</h3>
                  <p className="text-neutral-600">Bank-level security with 2FA, rate limiting, IP allowlisting, and encrypted data storage.</p>
                </div>
              </div>
            </div>
            
            <Card className="p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-neutral-800 mb-6">Quick Search</h3>
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-5 w-5" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Search Campaigns
                </Button>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-secondary" />
                    <span className="text-neutral-600">Secure Payments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-secondary" />
                    <span className="text-neutral-600">Verified Projects</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-secondary" />
                    <span className="text-neutral-600">Real-time Analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-secondary" />
                    <span className="text-neutral-600">Quality Assured</span>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
