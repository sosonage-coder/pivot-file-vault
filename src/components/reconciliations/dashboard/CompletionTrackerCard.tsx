import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompletionByArea } from '@/hooks/useReconciliationDashboard';

interface CompletionTrackerCardProps {
  completionByArea: CompletionByArea[];
}

export function CompletionTrackerCard({ completionByArea }: CompletionTrackerCardProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const totalCompleted = completionByArea.reduce((acc, area) => acc + area.completed, 0);
  const totalItems = completionByArea.reduce((acc, area) => acc + area.total, 0);
  const overallPercentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Completion by Area
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {completionByArea.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm">No areas to track</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className={cn(
                  'text-sm font-semibold',
                  overallPercentage >= 80 ? 'text-green-600 dark:text-green-400' :
                  overallPercentage >= 50 ? 'text-amber-600 dark:text-amber-400' :
                  'text-destructive'
                )}>
                  {overallPercentage}%
                </span>
              </div>
              <Progress 
                value={overallPercentage} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {totalCompleted} of {totalItems} reconciliations complete
              </p>
            </div>

            {/* Per-Area Progress */}
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {completionByArea.map((area) => (
                  <div key={area.areaName} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate max-w-[60%]">{area.areaName}</span>
                      <span className="text-xs text-muted-foreground">
                        {area.completed}/{area.total}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          'h-full transition-all',
                          getProgressColor(area.percentage)
                        )}
                        style={{ width: `${area.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
