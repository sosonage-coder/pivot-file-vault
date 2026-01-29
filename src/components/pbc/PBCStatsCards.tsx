import { 
  Clock, 
  Upload, 
  Eye, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { PbcStatus } from '@/types/filegrid';

interface PBCStatsCardsProps {
  stats: {
    Requested: number;
    Uploaded: number;
    Reviewed: number;
    Complete: number;
    total: number;
    overdue: number;
  };
  onStatusClick?: (status: PbcStatus | null) => void;
  activeStatus?: PbcStatus | null;
}

const statusConfig: Record<PbcStatus, { 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
  label: string 
}> = {
  Requested: { 
    icon: Clock, 
    color: 'text-amber-600 dark:text-amber-400', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Requested' 
  },
  Uploaded: { 
    icon: Upload, 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Uploaded' 
  },
  Reviewed: { 
    icon: Eye, 
    color: 'text-purple-600 dark:text-purple-400', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Reviewed' 
  },
  Complete: { 
    icon: CheckCircle, 
    color: 'text-green-600 dark:text-green-400', 
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Complete' 
  },
};

const statusOrder: PbcStatus[] = ['Requested', 'Uploaded', 'Reviewed', 'Complete'];

export function PBCStatsCards({ stats, onStatusClick, activeStatus }: PBCStatsCardsProps) {
  const completionRate = stats.total > 0 
    ? Math.round((stats.Complete / stats.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {/* Total Card */}
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          activeStatus === null && "ring-2 ring-primary"
        )}
        onClick={() => onStatusClick?.(null)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      {statusOrder.map((status) => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const count = stats[status];
        const isActive = activeStatus === status;

        return (
          <Card 
            key={status}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isActive && "ring-2 ring-primary"
            )}
            onClick={() => onStatusClick?.(status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", config.bgColor)}>
                  <Icon className={cn("h-5 w-5", config.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Overdue Card */}
      {stats.overdue > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
