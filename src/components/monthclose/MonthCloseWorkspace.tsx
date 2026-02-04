import { useState, useMemo } from 'react';
import { LayoutDashboard, Calendar, ListTodo, FolderOpen, Loader2, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChecklistWorkspace } from '@/components/checklists/ChecklistWorkspace';
import { CloseCalendarView } from '@/components/checklists/CloseCalendarView';
import { useTaskChecklists, useChecklistStats, useChecklistItems } from '@/hooks/useTaskChecklists';
import { parseISO, differenceInDays, addDays, format } from 'date-fns';

interface MonthCloseWorkspaceProps {
  entityId: string;
  periodId?: string | null;
}

export function MonthCloseWorkspace({ entityId, periodId }: MonthCloseWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  
  // Fetch all checklists for dashboard - look for close schedules (those with start_date)
  const { data: checklists = [], isLoading } = useTaskChecklists(entityId, {
    periodId,
    isTemplate: false,
  });

  // Find close schedules (checklists with start_date and duration_days)
  const closeSchedules = useMemo(() => 
    checklists.filter(c => c.start_date && c.duration_days),
    [checklists]
  );

  // Auto-select first close schedule if none selected
  const activeSchedule = selectedChecklistId 
    ? closeSchedules.find(c => c.id === selectedChecklistId) 
    : closeSchedules[0];

  // Fetch items for the active close schedule
  const { data: scheduleItems = [] } = useChecklistItems(activeSchedule?.id || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-10 bg-transparent p-0">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="tasks"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Checklists
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <CloseDashboard 
              entityId={entityId} 
              periodId={periodId} 
              closeSchedules={closeSchedules}
              onSelectSchedule={setSelectedChecklistId}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {activeSchedule?.start_date && activeSchedule?.duration_days ? (
                <CloseCalendarView
                  items={scheduleItems}
                  startDate={activeSchedule.start_date}
                  durationDays={activeSchedule.duration_days}
                  onSelectItem={(item) => {
                    console.log('Selected item:', item);
                  }}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">No Close Schedule Found</p>
                  <p className="text-sm mt-1">Create a checklist with start date and duration to view the close calendar</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('tasks')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Close Schedule
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden">
          <ChecklistWorkspace 
            entityId={entityId} 
            periodId={periodId}
          />
        </TabsContent>

        <TabsContent value="documents" className="flex-1 m-0">
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <FolderOpen className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">Documents View</p>
              <p className="text-sm">Use the sidebar to browse closing documents</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Close Dashboard Component
// ============================================================

interface CloseDashboardProps {
  entityId: string;
  periodId?: string | null;
  closeSchedules: ReturnType<typeof useTaskChecklists>['data'];
  onSelectSchedule: (id: string) => void;
}

function CloseDashboard({ entityId, periodId, closeSchedules = [], onSelectSchedule }: CloseDashboardProps) {
  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let daysRemaining: number | null = null;

    closeSchedules.forEach(schedule => {
      if (schedule.start_date && schedule.duration_days) {
        const endDate = addDays(parseISO(schedule.start_date), schedule.duration_days);
        const remaining = differenceInDays(endDate, new Date());
        if (daysRemaining === null || remaining < daysRemaining) {
          daysRemaining = Math.max(0, remaining);
        }
      }
    });

    return { totalTasks, completedTasks, daysRemaining };
  }, [closeSchedules]);

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Close Schedules</CardDescription>
            <CardTitle className="text-2xl">{closeSchedules.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active close schedules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-2xl flex items-baseline gap-1">
              <AggregateProgress schedules={closeSchedules} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AggregateProgressBar schedules={closeSchedules} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Days Remaining</CardDescription>
            <CardTitle className="text-2xl">
              {aggregateStats.daysRemaining !== null ? aggregateStats.daysRemaining : '--'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Until close deadline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Blocked Tasks</CardDescription>
            <CardTitle className="text-2xl text-destructive">
              <AggregateOverdue schedules={closeSchedules} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Overdue items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Close Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Close Schedules</CardTitle>
          <CardDescription>
            Active close schedules for this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {closeSchedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No close schedules created yet</p>
              <p className="text-xs mt-1">Create a checklist with a start date and duration to track close activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {closeSchedules.map((schedule) => (
                <CloseScheduleRow 
                  key={schedule.id} 
                  checklist={schedule} 
                  onClick={() => onSelectSchedule(schedule.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Helper Components
// ============================================================

function CloseScheduleRow({ 
  checklist, 
  onClick 
}: { 
  checklist: NonNullable<ReturnType<typeof useTaskChecklists>['data']>[0];
  onClick: () => void;
}) {
  const { data: stats } = useChecklistStats(checklist.id);
  
  const dateRange = useMemo(() => {
    if (!checklist.start_date || !checklist.duration_days) return null;
    const start = parseISO(checklist.start_date);
    const end = addDays(start, checklist.duration_days);
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }, [checklist.start_date, checklist.duration_days]);

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{checklist.name}</p>
          <p className="text-xs text-muted-foreground">
            {dateRange || `${checklist.duration_days || '--'} days`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {stats && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium">{stats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">
                {stats.done}/{stats.total} complete
              </p>
            </div>
            <Progress value={stats.completionRate} className="w-24 h-2" />
          </>
        )}
        {stats?.overdue && stats.overdue > 0 && (
          <Badge variant="destructive" className="text-xs">
            {stats.overdue} overdue
          </Badge>
        )}
      </div>
    </div>
  );
}

function AggregateProgress({ schedules }: { schedules: ReturnType<typeof useTaskChecklists>['data'] }) {
  // This will aggregate in a future iteration - for now show placeholder
  if (schedules.length === 0) return <>--<span className="text-lg text-muted-foreground">%</span></>;
  
  // We'd need to aggregate stats from all schedules
  return <>--<span className="text-lg text-muted-foreground">%</span></>;
}

function AggregateProgressBar({ schedules }: { schedules: ReturnType<typeof useTaskChecklists>['data'] }) {
  return <Progress value={0} className="h-2" />;
}

function AggregateOverdue({ schedules }: { schedules: ReturnType<typeof useTaskChecklists>['data'] }) {
  if (schedules.length === 0) return <>0</>;
  return <>0</>;
}
