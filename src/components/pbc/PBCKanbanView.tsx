import { useMemo } from 'react';
import { 
  Clock, 
  Upload, 
  Eye, 
  CheckCircle,
  GripVertical,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUpdatePBCItem, type PbcItemWithRelations } from '@/hooks/usePBCItems';
import { toast } from '@/hooks/use-toast';
import type { PbcStatus } from '@/types/filegrid';

interface PBCKanbanViewProps {
  items: PbcItemWithRelations[];
  entityId: string;
  isLoading?: boolean;
}

const statusConfig: Record<PbcStatus, { 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
  headerBg: string;
}> = {
  Requested: { 
    icon: Clock, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    headerBg: 'bg-amber-100 dark:bg-amber-900/40'
  },
  Uploaded: { 
    icon: Upload, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    headerBg: 'bg-blue-100 dark:bg-blue-900/40'
  },
  Reviewed: { 
    icon: Eye, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    headerBg: 'bg-purple-100 dark:bg-purple-900/40'
  },
  Complete: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    headerBg: 'bg-green-100 dark:bg-green-900/40'
  },
};

const statusOrder: PbcStatus[] = ['Requested', 'Uploaded', 'Reviewed', 'Complete'];

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  normal: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export function PBCKanbanView({ items, entityId, isLoading }: PBCKanbanViewProps) {
  const updateItem = useUpdatePBCItem();

  // Group items by status
  const columns = useMemo(() => {
    const grouped: Record<PbcStatus, PbcItemWithRelations[]> = {
      Requested: [],
      Uploaded: [],
      Reviewed: [],
      Complete: [],
    };

    items.forEach(item => {
      grouped[item.status].push(item);
    });

    return grouped;
  }, [items]);

  const handleDragStart = (e: React.DragEvent, item: PbcItemWithRelations) => {
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.setData('currentStatus', item.status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: PbcStatus) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    const currentStatus = e.dataTransfer.getData('currentStatus') as PbcStatus;

    if (currentStatus === targetStatus) return;

    try {
      await updateItem.mutateAsync({
        id: itemId,
        entityId,
        status: targetStatus,
      });
      toast({ title: `Moved to ${targetStatus}` });
    } catch (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {statusOrder.map(status => (
          <div key={status} className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statusOrder.map(status => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const columnItems = columns[status];

        return (
          <div
            key={status}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className={cn(
              "flex items-center gap-2 rounded-t-lg px-3 py-2",
              config.headerBg
            )}>
              <Icon className={cn("h-4 w-4", config.color)} />
              <span className="font-medium">{status}</span>
              <Badge variant="secondary" className="ml-auto">
                {columnItems.length}
              </Badge>
            </div>

            {/* Column Body */}
            <div className={cn(
              "min-h-[400px] flex-1 space-y-2 rounded-b-lg border border-t-0 p-2",
              config.bgColor
            )}>
              {columnItems.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  Drop items here
                </div>
              ) : (
                columnItems.map(item => (
                  <Card
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-tight">
                            {item.document_types.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {item.areas.name}
                          </p>
                          {item.objects && (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.objects.name}
                            </p>
                          )}
                          
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            {/* Priority badge */}
                            {item.priority && item.priority !== 'normal' && (
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs", priorityColors[item.priority])}
                              >
                                {item.priority}
                              </Badge>
                            )}
                            
                            {/* Period badge */}
                            <Badge variant="outline" className="text-xs">
                              {item.periods.label}
                            </Badge>

                            {/* Due date */}
                            {item.due_date && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  isOverdue(item.due_date) && status !== 'Complete' && 
                                  "border-destructive text-destructive"
                                )}
                              >
                                {isOverdue(item.due_date) && status !== 'Complete' && (
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                )}
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date(item.due_date).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
