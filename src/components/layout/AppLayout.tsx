import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedSidebar } from './UnifiedSidebar';
import { OnboardingGate } from '@/components/onboarding/OnboardingGate';

export function AppLayout() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored === 'true';
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect root to default feature
  if (location.pathname === '/') {
    return <Navigate to="/command-center" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <OnboardingGate />
      <UnifiedSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
