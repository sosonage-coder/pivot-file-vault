import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { SidebarSelectionProvider } from "@/contexts/SidebarSelectionContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { CloseCalendarPage } from "./pages/CloseCalendarPage";
import { ReconciliationsPage } from "./pages/ReconciliationsPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { PBCRequestsPage } from "./pages/PBCRequestsPage";
import { ChecklistsPage } from "./pages/ChecklistsPage";
import { MeetingsPage } from "./pages/MeetingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ModuleProvider>
            <SidebarSelectionProvider>
              <Routes>
                {/* Main app with feature-first layout */}
                <Route element={<AppLayout />}>
                  <Route index element={<Navigate to="/close" replace />} />
                  <Route path="/close/*" element={<CloseCalendarPage />} />
                  <Route path="/reconciliations/*" element={<ReconciliationsPage />} />
                  <Route path="/documents/*" element={<DocumentsPage />} />
                  <Route path="/pbc/*" element={<PBCRequestsPage />} />
                  <Route path="/checklists/*" element={<ChecklistsPage />} />
                  <Route path="/meetings/*" element={<MeetingsPage />} />
                </Route>
                
                {/* Auth route (no layout) */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarSelectionProvider>
          </ModuleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
