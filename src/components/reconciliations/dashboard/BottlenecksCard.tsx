import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertOctagon, PlayCircle, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BottleneckItem } from '@/hooks/useReconciliationDashboard';
import type { ReconciliationStatus } from '@/types/reconciliations';

interface BottlenecksCardProps {
  bottlenecks: BottleneckItem[];
  onSelect?: (id: string) => void;
}

const statusConfig: Record<ReconciliationStatus, {
  label: string;
  icon: typeof PlayCircle;
  color: string;
}> = {
  not_started: { label: 'Not Started', icon: Clock, color: 'text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: 'text-blue-600 dark:text-blue-400' },
  pending_review: { label: 'Pending Review', icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-destructive' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
  certified: { label: 'Certified', icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400' },
};

export function BottlenecksCard({ bottlenecks, onSelect }: BottlenecksCardProps) {
  const getSeverityColor = (avgDays: number) => {
    if (avgDays > 7) return 'bg-destructive/10 border-destructive/30';
    if (avgDays > 3) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertOctagon className="h-4 w-4 text-orange-500" />
          Workflow Bottlenecks
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {bottlenecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm">No bottlenecks detected</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {bottlenecks.map((item) => {
                const config = statusConfig[item.status];
                const Icon = config.icon;

                return (
                  <div
                    key={item.status}
                    className={cn(
                      'rounded-lg border p-4 transition-all',
                      getSeverityColor(item.avgDaysInStatus)
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', config.color)} />
                        <span className="font-medium text-sm">{config.label}</span>
                      </div>
                      <Badge variant="secondary">
                        {item.count} items
                      </Badge>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Avg. Days</p>
                        <p className={cn(
                          'text-lg font-semibold',
                          item.avgDaysInStatus > 7 ? 'text-destructive' :
                          item.avgDaysInStatus > 3 ? 'text-amber-600 dark:text-amber-400' :
                          'text-foreground'
                        )}>
                          {item.avgDaysInStatus}
                        </p>
                      </div>
                      {item.oldestItem && (
                        <div>
                          <p className="text-xs text-muted-foreground">Oldest Item</p>
                          <button
                            onClick={() => onSelect?.(item.oldestItem!.id)}
                            className="text-sm text-primary hover:underline truncate block max-w-full text-left"
                          >
                            {item.oldestItem.accountName}
                            <span className="text-muted-foreground ml-1">
                              ({item.oldestItem.daysStuck}d)
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
