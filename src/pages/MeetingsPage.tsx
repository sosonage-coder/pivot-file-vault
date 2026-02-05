import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Plus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FeatureContent, FeatureLayout } from '@/components/layout/FeatureLayout';
import { useModule } from '@/contexts/ModuleContext';

interface MeetingItem {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  owner: string;
  attendees: number;
  status: 'scheduled' | 'in-progress' | 'completed';
}

const MEETINGS: MeetingItem[] = [
  {
    id: 'meeting-1',
    title: 'Daily Close Standup',
    dateLabel: 'Today',
    timeLabel: '09:00 AM',
    owner: 'Controller',
    attendees: 8,
    status: 'in-progress',
  },
  {
    id: 'meeting-2',
    title: 'Reconciliation Review',
    dateLabel: 'Tomorrow',
    timeLabel: '11:00 AM',
    owner: 'Accounting Manager',
    attendees: 6,
    status: 'scheduled',
  },
  {
    id: 'meeting-3',
    title: 'Audit Preparedness Sync',
    dateLabel: 'Friday',
    timeLabel: '03:00 PM',
    owner: 'External Reporting',
    attendees: 10,
    status: 'scheduled',
  },
  {
    id: 'meeting-4',
    title: 'Post-Close Retrospective',
    dateLabel: 'Last week',
    timeLabel: '02:00 PM',
    owner: 'Finance Ops',
    attendees: 12,
    status: 'completed',
  },
];

const STATUS_STYLES: Record<MeetingItem['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'in-progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export function MeetingsPage() {
  const { selectedEntity } = useModule();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMeetings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return MEETINGS;

    return MEETINGS.filter((meeting) =>
      [meeting.title, meeting.owner, meeting.status].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchTerm]);

  return (
    <FeatureLayout
      title="Meetings"
      description={selectedEntity ? `${selectedEntity.name} • agendas, notes, and actions` : 'Agendas, notes, and action items'}
      icon={<Users className="h-5 w-5" />}
      actions={
        <Button>
          <Plus className="mr-1.5 h-4 w-4" />
          Schedule Meeting
        </Button>
      }
    >
      <FeatureContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Upcoming</CardDescription>
                <CardTitle>{MEETINGS.filter((m) => m.status === 'scheduled').length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>In Progress</CardDescription>
                <CardTitle>{MEETINGS.filter((m) => m.status === 'in-progress').length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle>{MEETINGS.filter((m) => m.status === 'completed').length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Calendar Queue</CardTitle>
              <CardDescription>Filter by title, owner, or status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                {filteredMeetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">{meeting.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Owner: {meeting.owner}</p>
                      </div>
                      <Badge className={STATUS_STYLES[meeting.status]}>{meeting.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        {meeting.dateLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4" />
                        {meeting.timeLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {meeting.attendees} attendees
                      </span>
                    </div>
                  </div>
                ))}

                {filteredMeetings.length === 0 && (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No meetings match your search criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureContent>
    </FeatureLayout>
  );
}
