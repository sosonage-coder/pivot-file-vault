import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { PendingReviewItem } from '@/hooks/useReconciliationDashboard';

interface PendingReviewsCardProps {
  reviews: PendingReviewItem[];
  onSelect?: (id: string) => void;
}

export function PendingReviewsCard({ reviews, onSelect }: PendingReviewsCardProps) {
  const getUrgencyColor = (daysPending: number) => {
    if (daysPending > 5) return 'text-destructive bg-destructive/10';
    if (daysPending > 3) return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50';
    return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50';
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-blue-500" />
          Pending Reviews
          {reviews.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {reviews.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm">No pending reviews</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {reviews.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'group flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    'hover:bg-muted/50 cursor-pointer'
                  )}
                  onClick={() => onSelect?.(item.id)}
                >
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    getUrgencyColor(item.daysPending)
                  )}>
                    {item.daysPending}d
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.accountName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.areaName} • {item.periodLabel}
                    </p>
                    {item.submittedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
