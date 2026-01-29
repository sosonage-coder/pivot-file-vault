import { Loader2 } from 'lucide-react';
import { useReconciliationDashboard } from '@/hooks/useReconciliationDashboard';
import { SummaryCards } from './SummaryCards';
import { TopVariancesCard } from './TopVariancesCard';
import { PendingReviewsCard } from './PendingReviewsCard';
import { BottlenecksCard } from './BottlenecksCard';
import { CompletionTrackerCard } from './CompletionTrackerCard';

interface ReconciliationDashboardProps {
  entityId: string | null;
  periodId?: string | null;
  onSelectReconciliation?: (id: string) => void;
}

export function ReconciliationDashboard({
  entityId,
  periodId,
  onSelectReconciliation,
}: ReconciliationDashboardProps) {
  const { data, isLoading, error } = useReconciliationDashboard(entityId, periodId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
        Failed to load dashboard data
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Select an entity to view dashboard
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards Row */}
      <SummaryCards summary={data.summary} />

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Variances */}
        <TopVariancesCard
          variances={data.topVariances}
          onSelect={onSelectReconciliation}
        />

        {/* Pending Reviews */}
        <PendingReviewsCard
          reviews={data.pendingReviews}
          onSelect={onSelectReconciliation}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow Bottlenecks */}
        <BottlenecksCard
          bottlenecks={data.bottlenecks}
          onSelect={onSelectReconciliation}
        />

        {/* Completion by Area */}
        <CompletionTrackerCard completionByArea={data.completionByArea} />
      </div>
    </div>
  );
}
