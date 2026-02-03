import { LayoutDashboard, List, Columns3, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ViewMode = 'dashboard' | 'list' | 'kanban' | 'calendar';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  availableModes?: ViewMode[];
}

const modeConfig: Record<ViewMode, { icon: typeof LayoutDashboard; label: string }> = {
  dashboard: { icon: LayoutDashboard, label: 'Dashboard' },
  list: { icon: List, label: 'List' },
  kanban: { icon: Columns3, label: 'Kanban' },
  calendar: { icon: Calendar, label: 'Calendar' },
};

export function ViewModeToggle({ 
  value, 
  onChange, 
  availableModes = ['dashboard', 'list', 'kanban'] 
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
      {availableModes.map((mode) => {
        const config = modeConfig[mode];
        const Icon = config.icon;
        const isActive = value === mode;

        return (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(mode)}
                className={cn(
                  'h-7 px-2.5 gap-1.5 rounded-md text-xs font-medium transition-all',
                  isActive 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{config.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="sm:hidden">
              {config.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
