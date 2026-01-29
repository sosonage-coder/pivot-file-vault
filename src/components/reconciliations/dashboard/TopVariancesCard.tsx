import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VarianceItem } from '@/hooks/useReconciliationDashboard';

interface TopVariancesCardProps {
  variances: VarianceItem[];
  onSelect?: (id: string) => void;
}

export function TopVariancesCard({ variances, onSelect }: TopVariancesCardProps) {
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000000) {
      return `${sign}$${(absValue / 1000000).toFixed(2)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}$${(absValue / 1000).toFixed(1)}K`;
    }
    return `${sign}$${absValue.toFixed(2)}`;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Top Variances
          {variances.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {variances.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {variances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm">No variances to report</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {variances.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    'group flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    'hover:bg-muted/50 cursor-pointer'
                  )}
                  onClick={() => onSelect?.(item.id)}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm truncate">
                          {item.accountName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.areaName} • {item.periodLabel}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          'font-semibold text-sm',
                          item.variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                        )}>
                          {formatCurrency(item.variance)}
                        </p>
                      </div>
                    </div>
                    {item.varianceExplanation ? (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {item.varianceExplanation}
                      </p>
                    ) : (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        Unexplained
                      </Badge>
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
