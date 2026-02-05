import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

  if (!data || data.totalReconciliations === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
        No reconciliations available across entities.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reconciliations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data.totalReconciliations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data.completionRate}%</div>
            <Progress value={data.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data.pendingReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">{data.rejected}</div>
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
              {data.entities.map((entity) => (
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
