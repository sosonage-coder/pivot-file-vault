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
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { usePeriods } from '@/hooks/usePeriods';
import { usePBCItems, useUpdatePBCStatus, useDeletePBCItem } from '@/hooks/usePBCItems';
import { CreatePBCItemModal } from './CreatePBCItemModal';
import { toast } from '@/hooks/use-toast';
import type { Entity, PbcStatus } from '@/types/filegrid';

interface PBCListViewProps {
  entity: Entity;
}

const statusConfig: Record<PbcStatus, { icon: React.ElementType; color: string; label: string }> = {
  Requested: { icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900', label: 'Requested' },
  Uploaded: { icon: Upload, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900', label: 'Uploaded' },
  Reviewed: { icon: Eye, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900', label: 'Reviewed' },
  Complete: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900', label: 'Complete' },
};

const statusFlow: PbcStatus[] = ['Requested', 'Uploaded', 'Reviewed', 'Complete'];

export function PBCListView({ entity }: PBCListViewProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: periods = [], isLoading: periodsLoading } = usePeriods();
  const { data: pbcItems = [], isLoading: itemsLoading } = usePBCItems({
    entityId: entity.id,
    periodId: selectedPeriodId || null
  });

  const updateStatus = useUpdatePBCStatus();
  const deleteItem = useDeletePBCItem();

  const handleStatusChange = async (itemId: string, newStatus: PbcStatus) => {
    try {
      await updateStatus.mutateAsync({ id: itemId, status: newStatus, entityId: entity.id });
      toast({ title: 'Status updated' });
    } catch (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ id: itemId, entityId: entity.id });
      toast({ title: 'Request deleted' });
    } catch (error) {
      toast({ title: 'Error deleting request', variant: 'destructive' });
    }
  };

  const isLoading = periodsLoading || itemsLoading;

  // Stats
  const statsByStatus = pbcItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">PBC Requests</h3>
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="">All periods</SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {statusFlow.map((status) => {
          const config = statusConfig[status];
          const count = statsByStatus[status] || 0;
          return (
            <div key={status} className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <config.icon className={cn("h-4 w-4", config.color.split(' ')[0])} />
              <span className="text-sm font-medium">{config.label}</span>
              <Badge variant="secondary" className="ml-1">{count}</Badge>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pbcItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No PBC requests yet</p>
          <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Request
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Object</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pbcItems.map((item) => {
                const config = statusConfig[item.status];
                const StatusIcon = config.icon;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.areas.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.areas.processes.departments.name} / {item.areas.processes.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{item.document_types.name}</TableCell>
                    <TableCell>{item.objects?.name || '—'}</TableCell>
                    <TableCell>{item.periods.label}</TableCell>
                    <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(value) => handleStatusChange(item.id, value as PbcStatus)}
                      >
                        <SelectTrigger className="w-[140px]">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreatePBCItemModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        entity={entity}
      />
    </div>
  );
}
