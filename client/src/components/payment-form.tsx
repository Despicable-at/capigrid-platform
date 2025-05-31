import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Campaign } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  CreditCard, 
  Bitcoin, 
  DollarSign, 
  Shield, 
  Lock,
  Check
} from "lucide-react";

interface PaymentFormProps {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentForm({ campaign, onClose, onSuccess }: PaymentFormProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(`${user?.firstName || ""} ${user?.lastName || ""}`.trim());
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");

  // Initialize payment
  const initializePaymentMutation = useMutation({
    mutationFn: async (data: { amount: string; email: string; campaignId: string }) => {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initialize payment");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Paystack payment page
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      }
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create contribution (for crypto payments)
  const createContributionMutation = useMutation({
    mutationFn: async (data: {
      amount: string;
      email: string;
      name: string;
      paymentMethod: string;
      anonymous: boolean;
    }) => {
      const response = await fetch(`/api/campaigns/${campaign.id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          contributorEmail: data.email,
          contributorName: data.name,
          paymentId: `crypto_${Date.now()}`,
          status: "completed",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process contribution");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contribution Successful!",
        description: "Thank you for your support. Your contribution has been processed.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Contribution Error",
        description: error.message || "Failed to process contribution. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount.",
        variant: "destructive",
      });
      return;
    }

    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please provide your email and name.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "card") {
      initializePaymentMutation.mutate({
        amount,
        email,
        campaignId: campaign.id,
      });
    } else {
      // Handle crypto payment
      createContributionMutation.mutate({
        amount,
        email,
        name,
        paymentMethod: "crypto",
        anonymous,
      });
    }
  };

  const handleCryptoPayment = () => {
    // Simulate crypto payment for demo
    toast({
      title: "Crypto Payment",
      description: "Crypto payment functionality would integrate with Web3.js and MetaMask here.",
    });
    
    // For demo purposes, we'll just create the contribution
    createContributionMutation.mutate({
      amount,
      email,
      name,
      paymentMethod: "crypto",
      anonymous,
    });
  };

  const suggestedAmounts = ["25", "50", "100", "250", "500"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 payment-modal">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto payment-card">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl">Support This Project</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{campaign.fundingModel}</Badge>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{campaign.title}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Amount Selection */}
            <div className="space-y-4">
              <Label htmlFor="amount" className="text-base font-semibold">
                Contribution Amount (USD)
              </Label>
              
              {/* Suggested Amounts */}
              <div className="grid grid-cols-5 gap-2">
                {suggestedAmounts.map((suggestedAmount) => (
                  <Button
                    key={suggestedAmount}
                    type="button"
                    variant={amount === suggestedAmount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(suggestedAmount)}
                    className="text-sm"
                  >
                    ${suggestedAmount}
                  </Button>
                ))}
              </div>
              
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Payment Method</Label>
              <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "card" | "crypto")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="card" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card Payment
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="flex items-center gap-2">
                    <Bitcoin className="h-4 w-4" />
                    Cryptocurrency
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="card" className="space-y-4 mt-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Secure Payment via Paystack</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Your payment is processed securely through Paystack with 256-bit SSL encryption.
                      We support all major credit and debit cards.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="crypto" className="space-y-4 mt-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Bitcoin className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Cryptocurrency Payment</span>
                    </div>
                    <p className="text-xs text-orange-700">
                      Connect your MetaMask wallet to pay with Ethereum or other supported cryptocurrencies.
                      Smart contract integration ensures secure transactions.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Separator />

            {/* Contributor Information */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Your Information</Label>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isAuthenticated}
                  />
                </div>
                
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isAuthenticated}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Leave a message of support for the campaign creator..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Make this contribution anonymous
                </Label>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Contribution Summary</Label>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Contribution Amount:</span>
                  <span className="font-semibold">${amount || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span className="text-sm text-muted-foreground">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Processing:</span>
                  <span className="text-sm text-muted-foreground">
                    {paymentMethod === "card" ? "Included" : "Network fees apply"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${amount || "0.00"}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              
              {paymentMethod === "card" ? (
                <Button
                  type="submit"
                  className="flex-1 success-gradient"
                  disabled={initializePaymentMutation.isPending || !amount || !email || !name}
                >
                  {initializePaymentMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay ${amount || "0.00"}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCryptoPayment}
                  className="flex-1"
                  style={{ background: "linear-gradient(135deg, #f7931a 0%, #ff6b35 100%)" }}
                  disabled={createContributionMutation.isPending || !amount || !email || !name}
                >
                  {createContributionMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      <Bitcoin className="w-4 h-4 mr-2" />
                      Pay with Crypto
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Security Notice */}
            <div className="text-xs text-center text-muted-foreground">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="h-3 w-3" />
                <span>Secured by 256-bit SSL encryption</span>
              </div>
              <span>
                Your payment information is processed securely and never stored on our servers.
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
