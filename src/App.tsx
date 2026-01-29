import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Documents from "./pages/Documents";
import PBC from "./pages/PBC";
import Tasks from "./pages/Tasks";
import Reconciliations from "./pages/Reconciliations";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ModuleProvider>
            <Routes>
              {/* Protected routes with shared layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Documents />} />
                <Route path="/pbc" element={<PBC />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/reconciliations" element={<Reconciliations />} />
              </Route>
              
              {/* Auth route (no layout) */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ModuleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
