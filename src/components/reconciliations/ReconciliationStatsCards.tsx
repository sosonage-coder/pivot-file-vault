import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReconciliationStats, ReconciliationStatus } from '@/types/reconciliations';
import { 
  FileSearch, 
  PlayCircle, 
  Clock, 
  XCircle, 
  CheckCircle, 
  ShieldCheck,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface ReconciliationStatsCardsProps {
  stats: ReconciliationStats;
  isLoading?: boolean;
  activeFilter?: ReconciliationStatus | null;
  onFilterChange?: (status: ReconciliationStatus | null) => void;
}

const statusConfig: {
  key: ReconciliationStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}[] = [
  { 
    key: 'not_started', 
    label: 'Not Started', 
    icon: FileSearch, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50'
  },
  { 
    key: 'in_progress', 
    label: 'In Progress', 
    icon: PlayCircle, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50'
  },
  { 
    key: 'pending_review', 
    label: 'Pending Review', 
    icon: Clock, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50'
  },
  { 
    key: 'rejected', 
    label: 'Rejected', 
    icon: XCircle, 
    color: 'text-destructive',
    bgColor: 'bg-destructive/10'
  },
  { 
    key: 'approved', 
    label: 'Approved', 
    icon: CheckCircle, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/50'
  },
  { 
    key: 'certified', 
    label: 'Certified', 
    icon: ShieldCheck, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50'
  },
];

export function ReconciliationStatsCards({
  stats,
  isLoading,
  activeFilter,
  onFilterChange,
}: ReconciliationStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="mt-2 h-8 w-12 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionRate = stats.total > 0 
    ? Math.round(((stats.approved + stats.certified) / stats.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {statusConfig.map(({ key, label, icon: Icon, color, bgColor }) => (
        <Card
          key={key}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            activeFilter === key && 'ring-2 ring-primary ring-offset-2',
            bgColor
          )}
          onClick={() => onFilterChange?.(activeFilter === key ? null : key)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
            </div>
            <p className={cn('mt-1 text-2xl font-bold', color)}>
              {stats[key]}
            </p>
          </CardContent>
        </Card>
      ))}
      
      {/* Completion Rate Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Completion
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-primary">
            {completionRate}%
          </p>
        </CardContent>
      </Card>
      
      {/* Variance Card */}
      <Card 
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          stats.withVariance > 0 && 'bg-destructive/10'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              'h-4 w-4',
              stats.withVariance > 0 ? 'text-destructive' : 'text-muted-foreground'
            )} />
            <span className="text-xs font-medium text-muted-foreground">
              Variances
            </span>
          </div>
          <p className={cn(
            'mt-1 text-2xl font-bold',
            stats.withVariance > 0 ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {stats.withVariance}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
