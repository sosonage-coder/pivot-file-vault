import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Building2, CalendarClock, CheckSquare, ClipboardList, FileText, Scale, Shield, Users } from 'lucide-react';
import { FeatureContent, FeatureLayout } from '@/components/layout/FeatureLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useModule } from '@/contexts/ModuleContext';

const QUICK_LINKS = [
  {
    id: 'close',
    title: 'Month Close',
    description: 'Track close progress, deadlines, and the close calendar.',
    path: '/close',
    icon: CalendarClock,
  },
  {
    id: 'reconciliations',
    title: 'Reconciliations',
    description: 'Review account truth, variance, and certification readiness.',
    path: '/reconciliations',
    icon: Scale,
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Manage evidence, document status, and file completeness.',
    path: '/documents',
    icon: FileText,
  },
  {
    id: 'pbc',
    title: 'PBC Requests',
    description: 'Coordinate auditor requests and response turnaround.',
    path: '/pbc',
    icon: ClipboardList,
  },
  {
    id: 'compliance',
    title: 'Compliance',
    description: 'Monitor regulatory obligations and recurring controls.',
    path: '/compliance',
    icon: Shield,
  },
  {
    id: 'checklists',
    title: 'Checklists',
    description: 'Drive owner accountability across close workstreams.',
    path: '/checklists',
    icon: CheckSquare,
  },
  {
    id: 'meetings',
    title: 'Meetings',
    description: 'Run agendas, capture decisions, and assign actions.',
    path: '/meetings',
    icon: Users,
  },
];

export function CommandCenterPage() {
  const navigate = useNavigate();
  const { selectedEntity, selectedPeriod } = useModule();

  const contextualSummary = useMemo(() => {
    return [
      { label: 'Entity', value: selectedEntity?.name || 'No entity selected', icon: Building2 },
      { label: 'Period', value: selectedPeriod?.label || 'No period selected', icon: CalendarClock },
      { label: 'Workspace', value: 'Finance Command Center', icon: Activity },
    ];
  }, [selectedEntity?.name, selectedPeriod?.label]);

  return (
    <FeatureLayout
      title="Command Center"
      description="Operational launchpad for FileGRID"
      icon={<Activity className="h-5 w-5" />}
    >
      <FeatureContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {contextualSummary.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {item.value}
                    </CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Module Quick Access</CardTitle>
              <CardDescription>
                Jump directly into the FileGRID modules used during month-end close and audit prep.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <div key={link.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Icon className="h-4 w-4 text-primary" />
                            {link.title}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => navigate(link.path)}
                      >
                        Open
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureContent>
    </FeatureLayout>
  );
}
