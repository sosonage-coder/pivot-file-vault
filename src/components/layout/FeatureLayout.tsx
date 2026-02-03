import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeatureLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  filterBar?: ReactNode;
  backButton?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function FeatureLayout({
  children,
  title,
  description,
  icon,
  actions,
  tabs,
  filterBar,
  backButton,
  className,
}: FeatureLayoutProps) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <header className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {backButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={backButton.onClick}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {backButton.label}
              </Button>
            )}
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {tabs && <div className="px-6 pb-0">{tabs}</div>}
      </header>

      {/* Horizontal Filter Bar */}
      {filterBar && (
        <div className="flex-none border-b bg-muted/30 px-6 py-2">
          {filterBar}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

interface FeatureContentProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function FeatureContent({ children, className, noPadding }: FeatureContentProps) {
  return (
    <div className={cn('h-full overflow-auto', !noPadding && 'p-6', className)}>
      {children}
    </div>
  );
}

interface FeatureEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function FeatureEmptyState({
  icon,
  title,
  description,
  action,
}: FeatureEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
