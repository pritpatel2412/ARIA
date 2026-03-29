import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Landing } from "@/pages/Landing";
import { Pricing } from "@/pages/Pricing";
import { Privacy } from "@/pages/Privacy";
import { Terms } from "@/pages/Terms";
import { About } from "@/pages/About";
import { AppDashboard } from "@/pages/AppDashboard";
import { Settings } from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={AppDashboard} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/about" component={About} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
