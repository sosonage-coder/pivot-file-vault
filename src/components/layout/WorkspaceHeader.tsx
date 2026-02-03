import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function WorkspaceHeader({
  title,
  description,
  icon,
  actions,
  className,
}: WorkspaceHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between border-b px-6 py-4', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface ViewToggleProps {
  views: { id: string; label: string; icon?: ReactNode }[];
  activeView: string;
  onViewChange: (viewId: string) => void;
}

export function ViewToggle({ views, activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            activeView === view.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {view.icon}
          {view.label}
        </button>
      ))}
    </div>
  );
}
