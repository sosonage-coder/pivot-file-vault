import { useState } from 'react';
import { LayoutDashboard, Calendar, ListTodo, FolderOpen, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChecklistWorkspace } from '@/components/checklists/ChecklistWorkspace';
import { useTaskChecklists, useChecklistStats } from '@/hooks/useTaskChecklists';

interface MonthCloseWorkspaceProps {
  entityId: string;
  periodId?: string | null;
}

interface CloseDashboardProps {
  entityId: string;
  periodId?: string | null;
  checklists: ReturnType<typeof useTaskChecklists>['data'];
}

function CloseDashboard({ entityId, periodId, checklists = [] }: CloseDashboardProps) {
  // Calculate overall close progress from all close schedule checklists
  const closeSchedules = checklists.filter(c => c.start_date);
  
  // Aggregate stats from close schedules
  let totalTasks = 0;
  let completedTasks = 0;
  let overdueTasks = 0;
  let inProgressTasks = 0;

  // We'll compute from the individual checklist stats in render
  // For now show a summary card

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
              --<span className="text-lg text-muted-foreground">%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={0} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Days Remaining</CardDescription>
            <CardTitle className="text-2xl">--</CardTitle>
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
            <CardTitle className="text-2xl text-destructive">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Require attention
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
              <p className="text-xs mt-1">Create a checklist with a start date to track close activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {closeSchedules.map((schedule) => (
                <CloseScheduleRow key={schedule.id} checklist={schedule} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CloseScheduleRow({ checklist }: { checklist: NonNullable<ReturnType<typeof useTaskChecklists>['data']>[0] }) {
  const { data: stats } = useChecklistStats(checklist.id);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{checklist.name}</p>
          <p className="text-xs text-muted-foreground">
            {checklist.start_date} • {checklist.duration_days || '--'} days
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

export function MonthCloseWorkspace({ entityId, periodId }: MonthCloseWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Fetch all checklists for dashboard
  const { data: checklists = [], isLoading } = useTaskChecklists(entityId, {
    periodId,
    isTemplate: false,
  });

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
              checklists={checklists}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="calendar" className="flex-1 m-0">
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">Calendar View</p>
              <p className="text-sm">Coming soon - will show tasks mapped to close days</p>
            </div>
          </div>
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
