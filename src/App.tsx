import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";

import Layout from "./components/Layout";

import Index from "./pages/Index";
import Competitions from "./pages/Competitions";
import NewCompetition from "./pages/NewCompetition";
import CompetitionDetail from "./pages/CompetitionDetail";
import FishFund from "./pages/FishFund";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicRegister from "./pages/PublicRegister";
import PendingParticipants from "./pages/PendingParticipants";
import PublicCompetitions from "./pages/PublicCompetitions";
import CheckStatus from "./pages/CheckStatus";
import NotFound from "./pages/NotFound";

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>

          {/* Layout wrapper */}
          <Route element={<Layout />}>

            {/* Beschermde routes */}
            <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
            <Route path="/competitions" element={<PrivateRoute><Competitions /></PrivateRoute>} />
            <Route path="/competitions/new" element={<PrivateRoute><NewCompetition /></PrivateRoute>} />
            <Route path="/competitions/:id" element={<PrivateRoute><CompetitionDetail /></PrivateRoute>} />
            <Route path="/fish-fund" element={<PrivateRoute><FishFund /></PrivateRoute>} />
            <Route path="/admin/aanmeldingen" element={<PrivateRoute><PendingParticipants /></PrivateRoute>} />

          </Route>

          {/* Publieke routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/meedoen/:id" element={<PublicRegister />} />
          <Route path="/aanbod" element={<PublicCompetitions />} />
          <Route path="/test" element={<div>✅ Test werkt</div>} />
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>

    </TooltipProvider>
  </AuthProvider>
);

export default App;
