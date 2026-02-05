import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Entity } from '@/types/filegrid';
import { useConsolidatedReconciliationSummary } from '@/hooks/useConsolidatedReconciliationSummary';

interface ConsolidatedReconciliationDashboardProps {
  entities: Entity[];
}

export function ConsolidatedReconciliationDashboard({
  entities,
}: ConsolidatedReconciliationDashboardProps) {
  const { data, isLoading, error } = useConsolidatedReconciliationSummary(entities);

  const [showSampleData, setShowSampleData] = useState(false);

  const sampleData = {
    totalReconciliations: 128,
    completionRate: 76,
    pendingReview: 14,
    rejected: 3,
    varianceTotal: 182340,
    entities: [
      {
        entityId: 'sample-1',
        entityName: 'Acme Holdings',
        total: 54,
        completed: 42,
        completionRate: 78,
        pendingReview: 6,
        rejected: 1,
        varianceTotal: 74210,
      },
      {
        entityId: 'sample-2',
        entityName: 'Acme Retail',
        total: 38,
        completed: 29,
        completionRate: 76,
        pendingReview: 4,
        rejected: 1,
        varianceTotal: 51230,
      },
      {
        entityId: 'sample-3',
        entityName: 'Acme Services',
        total: 36,
        completed: 26,
        completionRate: 72,
        pendingReview: 4,
        rejected: 1,
        varianceTotal: 56900,
      },
    ],
  };

  // Use real data when available; fall back to sample data if user requests it
  const dashboardData = showSampleData ? sampleData : data;

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
        Failed to load consolidated reconciliation data
      </div>
    );
  }

  if (!dashboardData || dashboardData.totalReconciliations === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
        <div className="space-y-3">
          <div>No reconciliations available across entities.</div>
          {!showSampleData && (
            <Button variant="outline" onClick={() => setShowSampleData(true)}>
              View sample data
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reconciliations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{dashboardData.totalReconciliations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{dashboardData.completionRate}%</div>
            <Progress value={dashboardData.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{dashboardData.pendingReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">{dashboardData.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Pending Review</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData.entities.map((entity) => (
                <TableRow key={entity.entityId}>
                  <TableCell className="font-medium">{entity.entityName}</TableCell>
                  <TableCell className="text-right">{entity.total}</TableCell>
                  <TableCell className="text-right">{entity.completed}</TableCell>
                  <TableCell className="text-right">{entity.pendingReview}</TableCell>
                  <TableCell className="text-right">{entity.rejected}</TableCell>
                  <TableCell className="text-right">{entity.completionRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
