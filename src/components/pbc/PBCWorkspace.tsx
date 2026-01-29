import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Calendar, 
  User, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUpdatePBCItem } from '@/hooks/usePBCItems';
import type { PbcItemWithRelations } from '@/hooks/usePBCItems';
import type { PbcStatus } from '@/types/filegrid';

interface PBCWorkspaceProps {
  item: PbcItemWithRelations | null;
  entityId: string;
  onFulfill?: (item: PbcItemWithRelations) => void;
}

const statusConfig: Record<PbcStatus, {
  label: string;
  color: string;
  bgClass: string;
  nextStatus?: PbcStatus;
}> = {
  Requested: {
    label: 'Requested',
    color: 'text-amber-600',
    bgClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    nextStatus: 'Uploaded',
  },
  Uploaded: {
    label: 'Uploaded',
    color: 'text-blue-600',
    bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    nextStatus: 'Reviewed',
  },
  Reviewed: {
    label: 'Reviewed',
    color: 'text-purple-600',
    bgClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    nextStatus: 'Complete',
  },
  Complete: {
    label: 'Complete',
    color: 'text-green-600',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
};

const statusOrder: PbcStatus[] = ['Requested', 'Uploaded', 'Reviewed', 'Complete'];

export function PBCWorkspace({ item, entityId, onFulfill }: PBCWorkspaceProps) {
  const [notes, setNotes] = useState(item?.notes || '');
  const updateItem = useUpdatePBCItem();

  if (!item) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Select a PBC Item</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose an item from the tree to view details
          </p>
        </div>
      </div>
    );
  }

  const config = statusConfig[item.status];
  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'Complete';

  const handleStatusChange = (newStatus: PbcStatus) => {
    updateItem.mutate({
      id: item.id,
      entityId,
      status: newStatus,
    });
  };

  const handleSaveNotes = () => {
    updateItem.mutate({
      id: item.id,
      entityId,
      notes,
    });
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {item.document_types.name}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{item.areas.processes.departments.name}</span>
              <span>•</span>
              <span>{item.areas.processes.name}</span>
              <span>•</span>
              <span>{item.areas.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn('gap-1', config.bgClass)}>
              {config.label}
            </Badge>
            
            {isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Change Status
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {statusOrder.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === item.status}
                  >
                    <div className={cn('mr-2 h-2 w-2 rounded-full', 
                      status === 'Requested' && 'bg-amber-500',
                      status === 'Uploaded' && 'bg-blue-500',
                      status === 'Reviewed' && 'bg-purple-500',
                      status === 'Complete' && 'bg-green-500'
                    )} />
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator />

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Period</p>
                  <p className="text-sm text-muted-foreground">{item.periods.label}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className={cn('text-sm', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                    {item.due_date ? format(new Date(item.due_date), 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
              </div>
              
              {item.objects && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Object</p>
                    <p className="text-sm text-muted-foreground">{item.objects.name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <Badge variant="outline" className="capitalize">
                    {item.priority || 'Normal'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.status === 'Requested' && (
                <Button 
                  className="w-full" 
                  onClick={() => onFulfill?.(item)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              )}
              
              {item.status === 'Uploaded' && (
                <Button 
                  className="w-full"
                  onClick={() => handleStatusChange('Reviewed')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Reviewed
                </Button>
              )}
              
              {item.status === 'Reviewed' && (
                <Button 
                  className="w-full"
                  onClick={() => handleStatusChange('Complete')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              )}
              
              {item.status === 'Complete' && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Request Fulfilled</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this request..."
              rows={4}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveNotes}
                disabled={updateItem.isPending || notes === (item.notes || '')}
              >
                {updateItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span>Created on {format(new Date(item.created_at), 'MMM d, yyyy')}</span>
              </div>
              {item.updated_at !== item.created_at && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <span>Last updated {format(new Date(item.updated_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
