import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActiveBatchProvider } from "@/lib/active-batch-context";

import Home from "@/pages/home";
import StartBatch from "@/pages/start-batch";
import StartupChecklist from "@/pages/startup-checklist";
import HourlyChecks from "@/pages/hourly-checks";
import WeightCheck from "@/pages/weight-check";
import Cleaning from "@/pages/cleaning";
import ReportProblem from "@/pages/report-problem";
import FinishBatch from "@/pages/finish-batch";
import BatchSearch from "@/pages/batch-search";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/start-batch" component={StartBatch} />
      <Route path="/startup-checklist" component={StartupChecklist} />
      <Route path="/hourly-checks" component={HourlyChecks} />
      <Route path="/weight-check" component={WeightCheck} />
      <Route path="/cleaning" component={Cleaning} />
      <Route path="/report-problem" component={ReportProblem} />
      <Route path="/finish-batch" component={FinishBatch} />
      <Route path="/batch-search" component={BatchSearch} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ActiveBatchProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster position="top-center" richColors />
        </ActiveBatchProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
