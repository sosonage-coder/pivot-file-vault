import { Card, CardContent } from '@/components/ui/card';
import { 
  FileCheck2, 
  TrendingUp, 
  AlertTriangle, 
  Target 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  summary: {
    totalReconciliations: number;
    completionRate: number;
    avgVariance: number;
    itemsNeedingAttention: number;
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const cards = [
    {
      label: 'Total Reconciliations',
      value: summary.totalReconciliations.toString(),
      icon: FileCheck2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Completion Rate',
      value: `${summary.completionRate}%`,
      icon: TrendingUp,
      color: summary.completionRate >= 80 
        ? 'text-green-600 dark:text-green-400' 
        : summary.completionRate >= 50 
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-destructive',
      bgColor: summary.completionRate >= 80 
        ? 'bg-green-50 dark:bg-green-950/50' 
        : summary.completionRate >= 50 
          ? 'bg-amber-50 dark:bg-amber-950/50'
          : 'bg-destructive/10',
    },
    {
      label: 'Avg Variance',
      value: formatCurrency(summary.avgVariance),
      icon: Target,
      color: summary.avgVariance === 0 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-amber-600 dark:text-amber-400',
      bgColor: summary.avgVariance === 0 
        ? 'bg-green-50 dark:bg-green-950/50' 
        : 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      label: 'Needs Attention',
      value: summary.itemsNeedingAttention.toString(),
      icon: AlertTriangle,
      color: summary.itemsNeedingAttention > 0 
        ? 'text-destructive' 
        : 'text-green-600 dark:text-green-400',
      bgColor: summary.itemsNeedingAttention > 0 
        ? 'bg-destructive/10' 
        : 'bg-green-50 dark:bg-green-950/50',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className={cn('transition-shadow hover:shadow-md', card.bgColor)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', card.bgColor)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className={cn('text-2xl font-bold', card.color)}>
                  {card.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
