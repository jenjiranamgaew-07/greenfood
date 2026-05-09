import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import { ActiveBatchProvider } from "./lib/active-batch-context";

import Home from "./pages/home";
import StartBatch from "./pages/start-batch";
import StartupChecklist from "./pages/startup-checklist";
import HourlyChecks from "./pages/hourly-checks";
import WeightCheck from "./pages/weight-check";
import Cleaning from "./pages/cleaning";
import ReportProblem from "./pages/report-problem";
import FinishBatch from "./pages/finish-batch";
import BatchSearch from "./pages/batch-search";
import Dashboard from "./pages/dashboard";
import Settings from "./pages/settings";
import NotFound from "./pages/not-found";

function App() {
  return (
    <TooltipProvider>
      <ActiveBatchProvider>
        <Home />
        <StartBatch />
        <StartupChecklist />
        <HourlyChecks />
        <WeightCheck />
        <Cleaning />
        <ReportProblem />
        <FinishBatch />
        <BatchSearch />
        <Dashboard />
        <Settings />
        <NotFound />
        <Toaster />
      </ActiveBatchProvider>
    </TooltipProvider>
  );
}

export default App;
