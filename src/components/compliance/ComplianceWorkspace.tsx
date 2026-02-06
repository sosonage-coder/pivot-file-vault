import { useState, useMemo } from 'react';
import { format, isBefore, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import {
  Plus,
  List,
  LayoutDashboard,
  LayoutGrid,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useModule } from '@/contexts/ModuleContext';
import { useComplianceItems, useDeleteComplianceItem } from '@/hooks/useComplianceItems';
import { ComplianceItemModal } from './ComplianceItemModal';
import type { ComplianceItem, ComplianceStatus, ComplianceCategory } from '@/types/compliance';

type ViewMode = 'dashboard' | 'list' | 'kanban' | 'calendar';

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Shield },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertTriangle },
};

const CATEGORY_COLORS: Record<ComplianceCategory, string> = {
  Lender: 'bg-purple-500/10 text-purple-600',
  Tax: 'bg-orange-500/10 text-orange-600',
  Regulatory: 'bg-teal-500/10 text-teal-600',
  Internal: 'bg-gray-500/10 text-gray-600',
};

export function ComplianceWorkspace() {
  const { selectedEntity, selectedPeriod } = useModule();
  const { data: items = [], isLoading } = useComplianceItems(selectedEntity?.id || null, selectedPeriod?.id);
  const deleteMutation = useDeleteComplianceItem();

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ComplianceItem | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Auto-update overdue items
  const processedItems = useMemo(() => {
    const today = startOfDay(new Date());
    return items.map(item => {
      if (item.status !== 'completed' && isBefore(new Date(item.due_date), today)) {
        return { ...item, status: 'overdue' as ComplianceStatus };
      }
      return item;
    });
  }, [items]);

  const handleEdit = (item: ComplianceItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleDelete = (item: ComplianceItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete && selectedEntity) {
      await deleteMutation.mutateAsync({ id: itemToDelete.id, entityId: selectedEntity.id });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleNewItem = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  if (!selectedEntity) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select an entity to view compliance items</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Compliance Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Track deadlines and regulatory requirements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="dashboard" className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-1.5">
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleNewItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : viewMode === 'dashboard' ? (
          <DashboardView items={processedItems} />
        ) : viewMode === 'list' ? (
          <ListView items={processedItems} onEdit={handleEdit} onDelete={handleDelete} />
        ) : viewMode === 'kanban' ? (
          <KanbanView items={processedItems} onEdit={handleEdit} onDelete={handleDelete} />
        ) : (
          <CalendarView
            items={processedItems}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Modal */}
      <ComplianceItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityId={selectedEntity.id}
        periodId={selectedPeriod?.id}
        item={selectedItem}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Compliance Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DashboardView({ items }: { items: ComplianceItem[] }) {
  const summary = useMemo(() => {
    const total = items.length;
    const completed = items.filter(item => item.status === 'completed').length;
    const overdue = items.filter(item => item.status === 'overdue').length;
    const inProgress = items.filter(item => item.status === 'in_progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const upcoming = items
      .filter(item => item.status !== 'completed')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 6);

    return { total, completed, overdue, inProgress, completionRate, upcoming };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No compliance items</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add items to track upcoming compliance deadlines
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.completed}</div>
            <Progress value={summary.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">{summary.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
          ) : (
            summary.upcoming.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Due {format(new Date(item.due_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <Badge className={cn('text-xs capitalize', STATUS_CONFIG[item.status].color)}>
                  {STATUS_CONFIG[item.status].label}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// List View Component
function ListView({
  items,
  onEdit,
  onDelete,
}: {
  items: ComplianceItem[];
  onEdit: (item: ComplianceItem) => void;
  onDelete: (item: ComplianceItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No compliance items</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add items to track your compliance deadlines
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Recurrence</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status];
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={CATEGORY_COLORS[item.category]}>
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(item.due_date), 'MMM d, yyyy')}</TableCell>
                <TableCell className="capitalize">{item.recurrence.replace('-', ' ')}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(item)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

// Kanban View Component
function KanbanView({
  items,
  onEdit,
  onDelete,
}: {
  items: ComplianceItem[];
  onEdit: (item: ComplianceItem) => void;
  onDelete: (item: ComplianceItem) => void;
}) {
  const columns: ComplianceStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map((status) => {
        const config = STATUS_CONFIG[status];
        const columnItems = items.filter((item) => item.status === status);

        return (
          <div key={status} className="flex w-72 flex-none flex-col rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <config.icon className="h-4 w-4" />
              <span className="font-medium">{config.label}</span>
              <Badge variant="secondary" className="ml-auto">
                {columnItems.length}
              </Badge>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {columnItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer" onClick={() => onEdit(item)}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium leading-tight">{item.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', CATEGORY_COLORS[item.category])}>
                          {item.category}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

// Calendar View Component
function CalendarView({
  items,
  month,
  onMonthChange,
  onEdit,
}: {
  items: ComplianceItem[];
  month: Date;
  onMonthChange: (date: Date) => void;
  onEdit: (item: ComplianceItem) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ComplianceItem[]>();
    items.forEach((item) => {
      const dateKey = item.due_date;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(item);
    });
    return map;
  }, [items]);

  const firstDayOfMonth = startOfMonth(month).getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="flex h-full flex-col">
      {/* Calendar Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onMonthChange(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => onMonthChange(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid flex-1 grid-cols-7 gap-1">
        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} className="rounded-lg bg-muted/20" />
        ))}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate.get(dateKey) || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dateKey}
              className={cn(
                'flex flex-col rounded-lg border p-1.5',
                isToday && 'border-primary bg-primary/5',
                !isSameMonth(day, month) && 'opacity-50'
              )}
            >
              <span
                className={cn(
                  'mb-1 text-xs font-medium',
                  isToday && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </span>
              <ScrollArea className="flex-1">
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onEdit(item)}
                      className={cn(
                        'w-full truncate rounded px-1.5 py-0.5 text-left text-xs transition-colors hover:opacity-80',
                        STATUS_CONFIG[item.status].color
                      )}
                    >
                      {item.title}
                    </button>
                  ))}
                  {dayItems.length > 3 && (
                    <span className="block text-center text-xs text-muted-foreground">
                      +{dayItems.length - 3} more
                    </span>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
