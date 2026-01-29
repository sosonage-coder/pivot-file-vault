import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { PbcCompletion } from '@/types/pbc-tree';

interface PbcCompletionBadgeProps {
  completion: PbcCompletion;
  showProgress?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function PbcCompletionBadge({ 
  completion, 
  showProgress = false,
  size = 'sm',
  className 
}: PbcCompletionBadgeProps) {
  const { total, complete, percentage } = completion;

  if (total === 0) return null;

  const getColorClass = () => {
    if (percentage === 100) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  const getProgressColor = () => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-muted-foreground';
  };

  if (showProgress) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Progress 
          value={percentage} 
          className={cn(
            'h-1.5 w-16',
            size === 'md' && 'h-2 w-24'
          )}
        />
        <span className={cn(
          'text-xs font-medium',
          size === 'md' && 'text-sm',
          getColorClass()
        )}>
          {complete}/{total}
        </span>
      </div>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      size === 'md' && 'px-2.5 py-1 text-sm',
      'bg-muted',
      getColorClass(),
      className
    )}>
      {complete}/{total}
    </span>
  );
}
