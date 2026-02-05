import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  CalendarClock,
  Scale,
  FileText,
  ClipboardList,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useModule } from '@/contexts/ModuleContext';
import { useEntities } from '@/hooks/useEntities';
import { usePeriods } from '@/hooks/usePeriods';
import type { FeatureId } from '@/hooks/useActiveFeature';

const FEATURES = [
  {
    id: 'command-center' as FeatureId,
    label: 'Command Center',
    icon: Activity,
    path: '/command-center',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    shortcut: '⌘1',
  },
  {
    id: 'monthclose' as FeatureId,
    label: 'Close Calendar',
    icon: CalendarClock,
    path: '/close',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    shortcut: '⌘2',
  },
  {
    id: 'reconciliations' as FeatureId,
    label: 'Reconciliations',
    icon: Scale,
    path: '/reconciliations',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    shortcut: '⌘3',
  },
  {
    id: 'documents' as FeatureId,
    label: 'Documents',
    icon: FileText,
    path: '/documents',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    shortcut: '⌘4',
  },
  {
    id: 'pbc' as FeatureId,
    label: 'PBC Requests',
    icon: ClipboardList,
    path: '/pbc',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    shortcut: '⌘5',
  },
  {
    id: 'checklists' as FeatureId,
    label: 'Checklists',
    icon: CheckSquare,
    path: '/checklists',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    shortcut: '⌘6',
  },
  {
    id: 'meetings' as FeatureId,
    label: 'Meetings',
    icon: Users,
    path: '/meetings',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    shortcut: '⌘7',
  },
];

interface AppSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed = false, onCollapsedChange }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { selectedEntity, setSelectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { data: entities = [] } = useEntities();
  const { data: periods = [] } = usePeriods();

  // Auto-select first entity/period
  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity, setSelectedEntity]);

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod, setSelectedPeriod]);

  const activeFeature = FEATURES.find(f => location.pathname.startsWith(f.path))?.id || 'command-center';

  const handleFeatureClick = (feature: typeof FEATURES[0]) => {
    if (!feature.disabled) {
      navigate(feature.path);
    }
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-sidebar-background transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-14 items-center border-b px-4', collapsed && 'justify-center px-2')}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">F</span>
        </div>
        {!collapsed && (
          <span className="ml-2.5 text-lg font-semibold tracking-tight">FileGRID</span>
        )}
      </div>

      {/* Context Selectors */}
      {!collapsed && (
        <div className="space-y-2 border-b p-3">
          {/* Entity Selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Entity</label>
            <Select
              value={selectedEntity?.id || ''}
              onValueChange={(value) => {
                const entity = entities.find(e => e.id === value);
                if (entity) setSelectedEntity(entity);
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Period</label>
            <Select
              value={selectedPeriod?.id || ''}
              onValueChange={(value) => {
                const period = periods.find(p => p.id === value);
                if (period) setSelectedPeriod(period);
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Collapsed Context Indicators */}
      {collapsed && (
        <div className="flex flex-col items-center gap-2 border-b py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {selectedEntity?.name || 'No entity selected'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {selectedPeriod?.label || 'No period selected'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Feature Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;

            const navItem = (
              <button
                key={feature.id}
                onClick={() => handleFeatureClick(feature)}
                disabled={feature.disabled}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-accent text-accent-foreground',
                  isActive && 'relative before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary',
                  feature.disabled && 'cursor-not-allowed opacity-50',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                    isActive ? feature.bgColor : 'bg-transparent',
                    !isActive && 'group-hover:bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? feature.color : 'text-muted-foreground',
                      !isActive && 'group-hover:text-foreground'
                    )}
                  />
                </div>
                {!collapsed && (
                  <span className={cn(!isActive && 'text-muted-foreground group-hover:text-foreground')}>
                    {feature.label}
                  </span>
                )}
                {!collapsed && feature.disabled && (
                  <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={feature.id}>
                  <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {feature.label}
                    {feature.disabled && (
                      <span className="text-xs text-muted-foreground">(Coming soon)</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navItem;
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-2">
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full justify-start gap-2', collapsed && 'justify-center px-2')}
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-muted-foreground">Collapse</span>
            </>
          )}
        </Button>

        <Separator className="my-2" />

        {/* User & Settings */}
        <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn('flex-1 justify-start gap-2', collapsed && 'w-full justify-center px-2')}
              >
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Settings</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className={cn(collapsed && 'w-full justify-center px-2')}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="sr-only">Sign out</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Sign out{user?.email && ` (${user.email})`}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
