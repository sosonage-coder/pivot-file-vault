import { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Upload, 
  Eye,
  MoreHorizontal,
  Trash2,
  FileCheck,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUpdatePBCItem, useDeletePBCItem, type PbcItemWithRelations } from '@/hooks/usePBCItems';
import { FulfillPBCModal } from '@/components/filegrid/FulfillPBCModal';
import { toast } from '@/hooks/use-toast';
import type { PbcStatus } from '@/types/filegrid';

interface PBCEnhancedListProps {
  items: PbcItemWithRelations[];
  entityId: string;
  isLoading?: boolean;
  onCreateNew?: () => void;
}

const statusConfig: Record<PbcStatus, { icon: React.ElementType; color: string; label: string }> = {
  Requested: { icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', label: 'Requested' },
  Uploaded: { icon: Upload, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', label: 'Uploaded' },
  Reviewed: { icon: Eye, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', label: 'Reviewed' },
  Complete: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', label: 'Complete' },
};

const statusFlow: PbcStatus[] = ['Requested', 'Uploaded', 'Reviewed', 'Complete'];

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  normal: { label: 'Normal', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
  low: { label: 'Low', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
};

export function PBCEnhancedList({ items, entityId, isLoading, onCreateNew }: PBCEnhancedListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fulfillItem, setFulfillItem] = useState<PbcItemWithRelations | null>(null);

  const updateItem = useUpdatePBCItem();
  const deleteItem = useDeletePBCItem();

  const handleStatusChange = async (itemId: string, newStatus: PbcStatus) => {
    try {
      await updateItem.mutateAsync({ id: itemId, status: newStatus, entityId });
      toast({ title: 'Status updated' });
    } catch (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const handlePriorityChange = async (itemId: string, newPriority: string) => {
    try {
      await updateItem.mutateAsync({ id: itemId, priority: newPriority, entityId });
      toast({ title: 'Priority updated' });
    } catch (error) {
      toast({ title: 'Error updating priority', variant: 'destructive' });
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ id: itemId, entityId });
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      toast({ title: 'Request deleted' });
    } catch (error) {
      toast({ title: 'Error deleting request', variant: 'destructive' });
    }
  };

  const handleBulkStatusChange = async (newStatus: PbcStatus) => {
    const promises = Array.from(selectedIds).map(id =>
      updateItem.mutateAsync({ id, status: newStatus, entityId })
    );
    try {
      await Promise.all(promises);
      toast({ title: `Updated ${selectedIds.size} items` });
      setSelectedIds(new Set());
    } catch (error) {
      toast({ title: 'Error updating items', variant: 'destructive' });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const isOverdue = (dueDate: string | null, status: PbcStatus) => {
    if (!dueDate || status === 'Complete') return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No PBC requests match your filters</p>
        {onCreateNew && (
          <Button className="mt-4" onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Set status:</span>
            {statusFlow.map(status => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange(status)}
              >
                {status}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedIds.size === items.length && items.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Area / Object</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const config = statusConfig[item.status];
              const StatusIcon = config.icon;
              const overdue = isOverdue(item.due_date, item.status);
              
              return (
                <TableRow key={item.id} className={cn(overdue && "bg-destructive/5")}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.document_types.name}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{item.areas.name}</p>
                      {item.objects && (
                        <p className="text-xs text-muted-foreground">{item.objects.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.periods.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.priority || 'normal'}
                      onValueChange={(value) => handlePriorityChange(item.id, value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {Object.entries(priorityConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            <Badge variant="secondary" className={cfg.color}>
                              {cfg.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {item.due_date ? (
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        overdue && "text-destructive font-medium"
                      )}>
                        {overdue && <AlertTriangle className="h-4 w-4" />}
                        <Calendar className="h-4 w-4" />
                        {new Date(item.due_date).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) => handleStatusChange(item.id, value as PbcStatus)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("h-4 w-4", config.color.split(' ')[0])} />
                          <span>{item.status}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {statusFlow.map((status) => {
                          const sc = statusConfig[status];
                          return (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <sc.icon className={cn("h-4 w-4", sc.color.split(' ')[0])} />
                                <span>{status}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {item.status === 'Requested' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-primary hover:text-primary"
                          onClick={() => setFulfillItem(item)}
                        >
                          <FileCheck className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <FulfillPBCModal
        open={!!fulfillItem}
        onOpenChange={(open) => !open && setFulfillItem(null)}
        pbcItem={fulfillItem}
      />
    </div>
  );
}
