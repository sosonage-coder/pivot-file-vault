import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Landmark,
  CreditCard,
  Clock,
  Truck,
  FileKey,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useReconciliations, useReconciliationTemplates } from '@/hooks/useReconciliations';
import type { ReconciliationTemplateType } from '@/types/reconciliations';

export interface ReconciliationCategoryNode {
  id: string;
  type: ReconciliationTemplateType;
  label: string;
  icon: typeof Landmark;
  count: number;
  certified: number;
}

interface ReconciliationSidebarTreeProps {
  entityId: string | null;
  periodId?: string | null;
  selectedCategory: ReconciliationTemplateType | null;
  onSelectCategory: (category: ReconciliationTemplateType) => void;
}

const CATEGORY_CONFIG: Record<ReconciliationTemplateType, { 
  label: string; 
  icon: typeof Landmark;
  order: number;
}> = {
  bank: { label: 'Bank', icon: Landmark, order: 1 },
  prepaid: { label: 'Prepaid', icon: Clock, order: 2 },
  accrual: { label: 'Accrual', icon: CreditCard, order: 3 },
  fixed_asset: { label: 'Fixed Assets', icon: Truck, order: 4 },
  lease: { label: 'Leases', icon: FileKey, order: 5 },
  intercompany: { label: 'Intercompany', icon: Building, order: 6 },
  general: { label: 'General', icon: FileSpreadsheet, order: 7 },
};

export function ReconciliationSidebarTree({
  entityId,
  periodId,
  selectedCategory,
  onSelectCategory,
}: ReconciliationSidebarTreeProps) {
  const { data: reconciliations = [], isLoading } = useReconciliations(entityId, periodId);
  
  // Build category stats from reconciliations
  const categories: ReconciliationCategoryNode[] = Object.entries(CATEGORY_CONFIG)
    .map(([type, config]) => {
      const typeRecons = reconciliations.filter(r => {
        const template = r.reconciliation_templates;
        if (type === 'general') {
          return !template || template.template_type === 'general';
        }
        return template?.template_type === type;
      });
      
      return {
        id: type,
        type: type as ReconciliationTemplateType,
        label: config.label,
        icon: config.icon,
        count: typeRecons.length,
        certified: typeRecons.filter(r => r.status === 'certified').length,
      };
    })
    .sort((a, b) => CATEGORY_CONFIG[a.type].order - CATEGORY_CONFIG[b.type].order);

  // Filter out empty categories (except if selected)
  const visibleCategories = categories.filter(
    cat => cat.count > 0 || cat.type === selectedCategory
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (visibleCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No reconciliations yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a reconciliation to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {visibleCategories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          isSelected={selectedCategory === category.type}
          onSelect={() => onSelectCategory(category.type)}
        />
      ))}
    </div>
  );
}

function CategoryItem({ 
  category, 
  isSelected,
  onSelect 
}: { 
  category: ReconciliationCategoryNode;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = category.icon;
  const progress = category.count > 0 
    ? Math.round((category.certified / category.count) * 100) 
    : 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        'hover:bg-[hsl(var(--tree-hover))]',
        isSelected && 'bg-[hsl(var(--tree-selected))] font-medium'
      )}
    >
      <Icon className={cn(
        'h-4 w-4',
        isSelected ? 'text-primary' : 'text-muted-foreground'
      )} />
      
      <span className="flex-1 truncate">{category.label}</span>
      
      {/* Progress indicator */}
      {category.count > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {category.certified}/{category.count}
        </span>
      )}
    </button>
  );
}
