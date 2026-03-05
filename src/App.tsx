import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Competitions from "./pages/Competitions";
import NewCompetition from "./pages/NewCompetition";
import CompetitionDetail from "./pages/CompetitionDetail";
import FishFund from "./pages/FishFund";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/competitions/new" element={<NewCompetition />} />
            <Route path="/competitions/:id" element={<CompetitionDetail />} />
            <Route path="/fish-fund" element={<FishFund />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
