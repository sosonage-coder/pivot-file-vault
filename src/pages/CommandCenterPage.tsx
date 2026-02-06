import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  FileText,
  Sparkles,
  Scale,
  Shield,
  Users,
} from 'lucide-react';
import { FeatureContent, FeatureLayout } from '@/components/layout/FeatureLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReconciliations, useReconciliationStats } from '@/hooks/useReconciliations';
import { useExpectedDocuments } from '@/hooks/useExpectedDocuments';
import { useTasks } from '@/hooks/useTasks';
import { isConsolidatedEntity } from '@/lib/entities';
import { useAllObjectsForEntity } from '@/hooks/useObjects';
import { usePBCItems } from '@/hooks/usePBCItems';
import { useAreasForEntity } from '@/hooks/useAreas';

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

function ragTone(percentage: number) {
  if (percentage >= 85) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  if (percentage >= 60) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
}

function readinessLabel(score: number) {
  if (score >= 85) return 'On track';
  if (score >= 60) return 'At risk';
  return 'Off track';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

const DEFAULT_MATERIALITY_THRESHOLD = 1000;

export function CommandCenterPage() {
  const navigate = useNavigate();
  const { selectedEntity, selectedPeriod } = useModule();
  const { user } = useAuth();
  const isConsolidated = isConsolidatedEntity(selectedEntity);

  const selectedEntityId = !isConsolidated ? selectedEntity?.id ?? null : null;
  const selectedPeriodId = selectedPeriod?.id ?? null;

  const { data: reconciliations = [] } = useReconciliations(selectedEntityId, selectedPeriodId);
  const { data: reconciliationStats } = useReconciliationStats(selectedEntityId, selectedPeriodId);
  const { data: expectedDocuments = [] } = useExpectedDocuments({
    entityId: selectedEntityId,
    periodId: selectedPeriodId,
  });
  const { data: myTasks = [] } = useTasks(selectedEntityId, {
    periodId: selectedPeriodId,
    assigneeId: user?.id ?? null,
  });
  const { data: objects = [] } = useAllObjectsForEntity(selectedEntityId);
  const { data: pbcItems = [] } = usePBCItems({
    entityId: selectedEntityId,
    periodId: selectedPeriodId,
  });
  const { data: areas = [] } = useAreasForEntity(selectedEntityId);

  const userIdentifier = user?.email?.toLowerCase() ?? '';

  const contextualSummary = useMemo(() => {
    return [
      { label: 'Entity', value: selectedEntity?.name || 'No entity selected', icon: Building2 },
      { label: 'Period', value: selectedPeriod?.label || 'No period selected', icon: CalendarClock },
      { label: 'Workspace', value: 'Finance Command Center', icon: Activity },
    ];
  }, [selectedEntity?.name, selectedPeriod?.label]);

  const areaRoleMap = useMemo(() => {
    const map = new Map<string, { owner_name?: string | null; reviewer_name?: string | null; approver_name?: string | null }>();
    areas.forEach((area) => {
      map.set(area.id, {
        owner_name: area.owner_name,
        reviewer_name: area.reviewer_name,
        approver_name: area.approver_name,
      });
    });
    return map;
  }, [areas]);

  const resolveRoleValue = (object: any, roleKey: 'owner_name' | 'reviewer_name' | 'approver_name') => {
    const direct = object?.[roleKey];
    if (direct) return direct;
    const areaRole = object?.areas?.[roleKey];
    if (areaRole) return areaRole;
    const areaDefaults = areaRoleMap.get(object?.area_id ?? '');
    return areaDefaults?.[roleKey] ?? '';
  };

  const commandCenterMetrics = useMemo(() => {
    const totalRecons = reconciliationStats?.total ?? 0;
    const completeRecons = (reconciliationStats?.approved ?? 0) + (reconciliationStats?.certified ?? 0);
    const completionRate = totalRecons > 0 ? Math.round((completeRecons / totalRecons) * 100) : 0;
    const pendingReview = reconciliationStats?.pending_review ?? 0;

    const missingRequired = expectedDocuments.filter((doc) => doc.required && !doc.uploaded).length;
    const uploadedFinals = expectedDocuments.filter((doc) => doc.uploaded).length;

    const openMyWork = myTasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled').length;

    return {
      completionRate,
      pendingReview,
      missingRequired,
      uploadedFinals,
      openMyWork,
    };
  }, [expectedDocuments, myTasks, reconciliationStats]);

  const areaProgress = useMemo(() => {
    const grouped = new Map<string, { total: number; complete: number }>();

    reconciliations.forEach((recon) => {
      const areaName = recon.objects?.areas?.name || 'Unassigned Area';
      const bucket = grouped.get(areaName) ?? { total: 0, complete: 0 };
      bucket.total += 1;
      if (recon.status === 'approved' || recon.status === 'certified') {
        bucket.complete += 1;
      }
      grouped.set(areaName, bucket);
    });

    return Array.from(grouped.entries())
      .map(([area, values]) => {
        const percentage = values.total > 0 ? Math.round((values.complete / values.total) * 100) : 0;
        return {
          area,
          total: values.total,
          complete: values.complete,
          percentage,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [reconciliations]);

  const varianceHotspots = useMemo(() => {
    return reconciliations
      .filter((recon) => Math.abs(Number(recon.variance) || 0) > 0)
      .map((recon) => ({
        id: recon.id,
        objectName: recon.objects?.name || 'Unknown Object',
        areaName: recon.objects?.areas?.name || 'Unassigned Area',
        variance: Number(recon.variance) || 0,
        status: recon.status,
      }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 10);
  }, [reconciliations]);

  const closePackCompletion = useMemo(() => {
    const packMap = new Map<string, { area: string; object: string; requiredDocs: number; uploadedDocs: number; reconsTotal: number; reconsFinal: number; checklistOpen: number; approvalRequired: boolean }>();

    objects.forEach((obj: any) => {
      const key = obj.id;
      packMap.set(key, {
        area: obj.areas?.name || 'Area',
        object: obj.name,
        requiredDocs: 0,
        uploadedDocs: 0,
        reconsTotal: 0,
        reconsFinal: 0,
        checklistOpen: 0,
        approvalRequired: Boolean(obj.requires_approval),
      });
    });

    expectedDocuments.forEach((doc) => {
      const objectId = doc.document?.object_id;
      if (!objectId || !packMap.has(objectId) || !doc.required) return;
      const pack = packMap.get(objectId)!;
      pack.requiredDocs += 1;
      if (doc.uploaded) pack.uploadedDocs += 1;
    });

    reconciliations.forEach((recon) => {
      if (!packMap.has(recon.object_id)) return;
      const pack = packMap.get(recon.object_id)!;
      pack.reconsTotal += 1;
      if (recon.status === 'approved' || recon.status === 'certified') {
        pack.reconsFinal += 1;
      }
    });

    return Array.from(packMap.values())
      .map((pack) => {
        const docCompletion = pack.requiredDocs > 0 ? pack.uploadedDocs / pack.requiredDocs : 1;
        const reconCompletion = pack.reconsTotal > 0 ? pack.reconsFinal / pack.reconsTotal : 1;
        const completion = Math.round(((docCompletion + reconCompletion) / 2) * 100);
        return { ...pack, completion };
      })
      .sort((a, b) => a.completion - b.completion)
      .slice(0, 8);
  }, [expectedDocuments, objects, reconciliations]);

  const exceptionsFeed = useMemo(() => {
    const items: Array<{ id: string; label: string; source: 'documents' | 'reconciliations' | 'pbc' | 'tasks'; detail: string; severity: 'high' | 'medium' | 'low'; href: string }> = [];

    expectedDocuments
      .filter((doc) => doc.required && !doc.uploaded)
      .slice(0, 10)
      .forEach((doc) => {
        items.push({
          id: `missing-doc-${doc.areaId}-${doc.documentTypeId}`,
          label: `Missing required document: ${doc.documentTypeName}`,
          source: 'documents',
          detail: `${doc.departmentName} / ${doc.processName} / ${doc.areaName}`,
          severity: 'high',
          href: '/documents',
        });
      });

    reconciliations
      .filter((recon) => {
        const variance = Math.abs(Number(recon.variance) || 0);
        const threshold = recon.objects?.variance_threshold ?? DEFAULT_MATERIALITY_THRESHOLD;
        const needsExplanation = variance > threshold && !recon.variance_explanation;
        return recon.status === 'pending_review' || recon.status === 'rejected' || needsExplanation;
      })
      .slice(0, 10)
      .forEach((recon) => {
        const threshold = recon.objects?.variance_threshold ?? DEFAULT_MATERIALITY_THRESHOLD;
        const variance = Math.abs(Number(recon.variance) || 0);
        const needsExplanation = variance > threshold && !recon.variance_explanation;
        items.push({
          id: `recon-${recon.id}`,
          label: `${recon.objects?.name || 'Reconciliation'} ${recon.status === 'rejected' ? 'rejected' : recon.status === 'pending_review' ? 'pending review' : 'needs variance note'}`,
          source: 'reconciliations',
          detail: recon.objects?.areas?.name || 'Unassigned Area',
          severity: needsExplanation ? 'high' : recon.status === 'rejected' ? 'high' : 'medium',
          href: `/reconciliations?id=${recon.id}&entityId=${selectedEntityId}`,
        });
      });

    pbcItems
      .filter((item) => item.status !== 'Complete')
      .slice(0, 10)
      .forEach((item) => {
        items.push({
          id: `pbc-${item.id}`,
          label: `PBC ${item.status}: ${item.document_types?.name || 'Request'}`,
          source: 'pbc',
          detail: `${item.areas?.name || 'Area'} / ${item.objects?.name || 'Object'}`,
          severity: item.status === 'Requested' ? 'high' : 'medium',
          href: '/pbc',
        });
      });

    myTasks
      .filter((task) => task.status !== 'completed' && task.status !== 'cancelled' && !!task.due_date)
      .slice(0, 6)
      .forEach((task) => {
        const overdue = task.due_date ? new Date(task.due_date) < new Date() : false;
        if (!overdue) return;
        items.push({
          id: `task-${task.id}`,
          label: `Overdue task: ${task.title}`,
          source: 'tasks',
          detail: task.due_date || 'No due date',
          severity: 'high',
          href: '/checklists',
        });
      });

    const weight = { high: 3, medium: 2, low: 1 };
    return items.sort((a, b) => weight[b.severity] - weight[a.severity]).slice(0, 14);
  }, [expectedDocuments, reconciliations, pbcItems, myTasks, selectedEntityId]);

  const myWorkQueue = useMemo(() => {
    if (!userIdentifier) return [];
    const items: Array<{ id: string; label: string; detail: string; href: string }> = [];

    myTasks
      .filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
      .slice(0, 6)
      .forEach((task) => {
        const dueLabel = task.due_date ? `Due ${task.due_date}` : 'No due date';
        items.push({
          id: `task-${task.id}`,
          label: task.title,
          detail: dueLabel,
          href: '/checklists',
        });
      });

    reconciliations
      .filter((recon) => !['approved', 'certified'].includes(recon.status))
      .forEach((recon) => {
        const owner = resolveRoleValue(recon.objects, 'owner_name');
        if (!owner || owner.toLowerCase() !== userIdentifier) return;
        items.push({
          id: `recon-${recon.id}`,
          label: recon.objects?.name || 'Reconciliation',
          detail: `${recon.objects?.areas?.name || 'Area'} • ${recon.status.replace('_', ' ')}`,
          href: `/reconciliations?id=${recon.id}&entityId=${selectedEntityId}`,
        });
      });

    return items.slice(0, 8);
  }, [myTasks, reconciliations, resolveRoleValue, selectedEntityId, userIdentifier]);

  const myReviewQueue = useMemo(() => {
    if (!userIdentifier) return [];
    return reconciliations
      .filter((recon) => ['pending_review', 'rejected'].includes(recon.status))
      .filter((recon) => {
        const reviewer = resolveRoleValue(recon.objects, 'reviewer_name');
        const approver = resolveRoleValue(recon.objects, 'approver_name');
        return [reviewer, approver].some((name) => name?.toLowerCase() === userIdentifier);
      })
      .map((recon) => ({
        id: `review-${recon.id}`,
        label: recon.objects?.name || 'Reconciliation',
        detail: `${recon.objects?.areas?.name || 'Area'} • ${recon.status.replace('_', ' ')}`,
        href: `/reconciliations?id=${recon.id}&entityId=${selectedEntityId}`,
      }))
      .slice(0, 8);
  }, [reconciliations, resolveRoleValue, selectedEntityId, userIdentifier]);

  const rolesSnapshot = useMemo(() => {
    const areaItems = areas
      .map((area) => ({
        id: area.id,
        label: area.name,
        owner: area.owner_name || 'Unassigned',
        reviewer: area.reviewer_name || 'Unassigned',
        approver: area.approver_name || 'Unassigned',
        scope: 'Area',
      }))
      .slice(0, 4);

    const objectItems = objects
      .map((obj: any) => ({
        id: obj.id,
        label: obj.name,
        owner: resolveRoleValue(obj, 'owner_name') || 'Unassigned',
        reviewer: resolveRoleValue(obj, 'reviewer_name') || 'Unassigned',
        approver: resolveRoleValue(obj, 'approver_name') || 'Unassigned',
        scope: 'Object',
      }))
      .slice(0, 6);

    return { areaItems, objectItems };
  }, [areas, objects, resolveRoleValue]);

  const roleCoverage = useMemo(() => {
    const countAssigned = (items: Array<{ owner: string; reviewer: string; approver: string }>) => {
      return items.reduce(
        (acc, item) => {
          acc.owner += item.owner !== 'Unassigned' ? 1 : 0;
          acc.reviewer += item.reviewer !== 'Unassigned' ? 1 : 0;
          acc.approver += item.approver !== 'Unassigned' ? 1 : 0;
          return acc;
        },
        { owner: 0, reviewer: 0, approver: 0 }
      );
    };

    return {
      area: { total: rolesSnapshot.areaItems.length, assigned: countAssigned(rolesSnapshot.areaItems) },
      object: { total: rolesSnapshot.objectItems.length, assigned: countAssigned(rolesSnapshot.objectItems) },
    };
  }, [rolesSnapshot]);

  const closeReadiness = useMemo(() => {
    const requiredDeliverables = expectedDocuments.filter((doc) => doc.required).length;
    const delivered = expectedDocuments.filter((doc) => doc.required && doc.uploaded).length;
    const deliverableScore = requiredDeliverables > 0 ? delivered / requiredDeliverables : 1;

    const totalRecons = reconciliationStats?.total ?? 0;
    const reviewed = (reconciliationStats?.approved ?? 0) + (reconciliationStats?.certified ?? 0);
    const reviewScore = totalRecons > 0 ? reviewed / totalRecons : 1;

    const exceptionScore = exceptionsFeed.length === 0
      ? 1
      : Math.max(0, 1 - exceptionsFeed.length / Math.max(8, totalRecons || 1));

    const overdueTasks = myTasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled' && task.due_date && new Date(task.due_date) < new Date()).length;
    const overdueScore = overdueTasks === 0
      ? 1
      : Math.max(0.4, 1 - overdueTasks / Math.max(6, myTasks.length || 1));

    const score = Math.round(((deliverableScore + reviewScore + exceptionScore + overdueScore) / 4) * 100);
    return {
      score,
      overdueTasks,
      exceptions: exceptionsFeed.length,
    };
  }, [expectedDocuments, exceptionsFeed.length, myTasks, reconciliationStats]);

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

          {isConsolidated ? (
            <Card>
              <CardHeader>
                <CardTitle>Consolidated Command Center</CardTitle>
                <CardDescription>
                  Select a specific entity to view close blockers, required deliverables, and accountability queues.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Executive Snapshot</h2>
                  <p className="text-sm text-muted-foreground">Status, risk, and accountability at a glance.</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-2 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  Latest period health
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Close Readiness Score</CardDescription>
                    <CardTitle>{closeReadiness.score}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={closeReadiness.score} className="h-2" />
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge className={ragTone(closeReadiness.score)}>{readinessLabel(closeReadiness.score)}</Badge>
                      <span>{closeReadiness.exceptions} exceptions</span>
                      <span>•</span>
                      <span>{closeReadiness.overdueTasks} overdue tasks</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Close Progress (RAG)</CardDescription>
                    <CardTitle>{commandCenterMetrics.completionRate}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={commandCenterMetrics.completionRate} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Stuck in Review</CardDescription>
                    <CardTitle>{commandCenterMetrics.pendingReview}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Missing Finals</CardDescription>
                    <CardTitle>{commandCenterMetrics.missingRequired}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Uploaded Deliverables</CardDescription>
                    <CardTitle>{commandCenterMetrics.uploadedFinals}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>My Open Work</CardDescription>
                    <CardTitle>{myWorkQueue.length}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>My Work</CardTitle>
                    <CardDescription>Tasks and reconciliations assigned to you as preparer.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {myWorkQueue.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        No open work assigned. Create a checklist task to get started.
                      </div>
                    ) : (
                      myWorkQueue.map((item) => (
                        <button
                          key={item.id}
                          className="flex w-full items-start justify-between rounded-md border p-2 text-left hover:bg-muted/50"
                          onClick={() => navigate(item.href)}
                        >
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                          </div>
                          <Badge variant="outline">Work</Badge>
                        </button>
                      ))
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>Workstream coverage updates automatically.</span>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/checklists')}>
                        View all work
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My Reviews</CardTitle>
                    <CardDescription>Items awaiting your review or approval.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {myReviewQueue.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        No reviews pending. You’re all caught up.
                      </div>
                    ) : (
                      myReviewQueue.map((item) => (
                        <button
                          key={item.id}
                          className="flex w-full items-start justify-between rounded-md border p-2 text-left hover:bg-muted/50"
                          onClick={() => navigate(item.href)}
                        >
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                          </div>
                          <Badge variant="outline">Review</Badge>
                        </button>
                      ))
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>Review load includes approvals and rejections.</span>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/reconciliations')}>
                        View review queue
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Roles & Responsibilities</CardTitle>
                    <CardDescription>Default preparer, reviewer, and approver coverage.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Areas: {roleCoverage.area.total}</Badge>
                        <span>Preparer {roleCoverage.area.assigned.owner}/{roleCoverage.area.total}</span>
                        <span>Reviewer {roleCoverage.area.assigned.reviewer}/{roleCoverage.area.total}</span>
                        <span>Approver {roleCoverage.area.assigned.approver}/{roleCoverage.area.total}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Objects: {roleCoverage.object.total}</Badge>
                        <span>Preparer {roleCoverage.object.assigned.owner}/{roleCoverage.object.total}</span>
                        <span>Reviewer {roleCoverage.object.assigned.reviewer}/{roleCoverage.object.total}</span>
                        <span>Approver {roleCoverage.object.assigned.approver}/{roleCoverage.object.total}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Areas</p>
                      {rolesSnapshot.areaItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No areas configured.</p>
                      ) : (
                        rolesSnapshot.areaItems.map((item) => (
                          <div key={item.id} className="rounded-md border p-2 text-sm">
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">Preparer: {item.owner}</p>
                            <p className="text-xs text-muted-foreground">Reviewer: {item.reviewer}</p>
                            <p className="text-xs text-muted-foreground">Approver: {item.approver}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Objects</p>
                      {rolesSnapshot.objectItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No objects configured.</p>
                      ) : (
                        rolesSnapshot.objectItems.map((item) => (
                          <div key={item.id} className="rounded-md border p-2 text-sm">
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">Preparer: {item.owner}</p>
                            <p className="text-xs text-muted-foreground">Reviewer: {item.reviewer}</p>
                            <p className="text-xs text-muted-foreground">Approver: {item.approver}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Operational Insights</h2>
                  <p className="text-sm text-muted-foreground">Focus areas for this close cycle.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/command-center')}>
                  Refresh insights
                </Button>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Close Packs (Entity / Period / Object)</CardTitle>
                    <CardDescription>Cross-module pack completion using required docs + reconciliation completion.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {closePackCompletion.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No close packs available for this context.</p>
                    ) : (
                      closePackCompletion.map((pack) => (
                        <div key={`${pack.area}-${pack.object}`} className="rounded-md border p-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{pack.object}</p>
                            <Badge className={ragTone(pack.completion)}>{pack.completion}%</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{pack.area}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Docs {pack.uploadedDocs}/{pack.requiredDocs || 0} • Recs {pack.reconsFinal}/{pack.reconsTotal || 0}{pack.approvalRequired ? ' • Approval required' : ''}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progress by Area</CardTitle>
                    <CardDescription>Department-wide close completion by area.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {areaProgress.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No reconciliations found for this context.</p>
                    ) : (
                      areaProgress.map((area) => (
                        <div key={area.area} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span>{area.area}</span>
                            <Badge className={ragTone(area.percentage)}>{area.percentage}%</Badge>
                          </div>
                          <Progress value={area.percentage} className="h-2" />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Variance Hotspots</CardTitle>
                    <CardDescription>Largest unresolved balances to review first.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {varianceHotspots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No variance hotspots in this period.</p>
                    ) : (
                      varianceHotspots.slice(0, 6).map((item) => (
                        <button
                          key={item.id}
                          className="flex w-full items-center justify-between rounded-md border p-2 text-left hover:bg-muted/50"
                          onClick={() => navigate(`/reconciliations?id=${item.id}&entityId=${selectedEntityId}`)}
                        >
                          <div>
                            <p className="text-sm font-medium">{item.objectName}</p>
                            <p className="text-xs text-muted-foreground">{item.areaName}</p>
                          </div>
                          <span className={item.variance >= 0 ? 'text-destructive text-sm font-medium' : 'text-amber-600 text-sm font-medium'}>
                            {formatCurrency(item.variance)}
                          </span>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Exceptions Feed</CardTitle>
                    <CardDescription>Global queue: missing docs, pending/rejected reviews, incomplete PBC, and overdue tasks.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {exceptionsFeed.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No exceptions for this context.</p>
                    ) : (
                      <>
                        {exceptionsFeed.map((item) => (
                          <button
                            key={item.id}
                            className="flex w-full items-start justify-between rounded-md border p-2 text-left hover:bg-muted/50"
                            onClick={() => navigate(item.href)}
                          >
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                            </div>
                            <Badge variant="outline" className={item.severity === 'high' ? 'border-red-400 text-red-700' : 'border-amber-400 text-amber-700'}>
                              {item.severity}
                            </Badge>
                          </button>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

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
