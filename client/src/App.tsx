import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Campaigns from "@/pages/campaigns";
import CampaignDetail from "@/pages/campaign-detail";
import CreateCampaign from "@/pages/create-campaign";
import Dashboard from "@/pages/dashboard";
import AdminPanel from "@/pages/admin-new";
import AdminLogin from "@/pages/admin-login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminPanel} />
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/campaigns/:id" component={CampaignDetail} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/campaigns/:id" component={CampaignDetail} />
          <Route path="/create-campaign" component={CreateCampaign} />
          <Route path="/dashboard" component={Dashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
