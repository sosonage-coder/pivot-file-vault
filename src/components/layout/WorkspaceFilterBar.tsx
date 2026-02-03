import { HierarchicalDatePicker } from '@/components/filegrid/HierarchicalDatePicker';
import { DimensionSelector, PivotDimension } from '@/components/filegrid/DimensionSelector';
import { ViewModeToggle, ViewMode } from './ViewModeToggle';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePeriods } from '@/hooks/usePeriods';
import { useModule } from '@/contexts/ModuleContext';
import type { DocumentStatus } from '@/types/filegrid';

const STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Final', label: 'Final' },
  { value: 'Superseded', label: 'Superseded' },
  { value: 'Archived', label: 'Archived' },
];

interface WorkspaceFilterBarProps {
  showStatusFilter?: boolean;
  showDimensionSelectors?: boolean;
  showViewModeToggle?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  availableViewModes?: ViewMode[];
  statusList?: DocumentStatus[];
  onStatusChange?: (statusList: DocumentStatus[]) => void;
  pivotRowDimension?: PivotDimension | null;
  pivotColDimension?: PivotDimension | null;
  onRowDimensionChange?: (dim: PivotDimension | null) => void;
  onColDimensionChange?: (dim: PivotDimension | null) => void;
}

export function WorkspaceFilterBar({
  showStatusFilter = false,
  showDimensionSelectors = false,
  showViewModeToggle = false,
  viewMode = 'list',
  onViewModeChange,
  availableViewModes = ['dashboard', 'list', 'kanban'],
  statusList = [],
  onStatusChange,
  pivotRowDimension,
  pivotColDimension,
  onRowDimensionChange,
  onColDimensionChange,
}: WorkspaceFilterBarProps) {
  const { data: periods = [] } = usePeriods();
  const { selectedPeriod, setSelectedPeriod } = useModule();

  // Extract selected year from current period
  const selectedYear = selectedPeriod?.label?.split('-')[0] || null;

  // For now, single-select month using period IDs
  const selectedMonthPeriodIds = selectedPeriod ? [selectedPeriod.id] : [];

  const handleYearChange = (year: string | null) => {
    if (!year) {
      // Clear period selection
      setSelectedPeriod(null);
      return;
    }
    // Select first month of the year
    const firstMonth = periods.find(p => p.type === 'month' && p.label.startsWith(year));
    if (firstMonth) {
      setSelectedPeriod(firstMonth);
    }
  };

  const handleMonthsChange = (periodIds: string[]) => {
    // For now, just select the first month (single select behavior)
    if (periodIds.length > 0) {
      const period = periods.find(p => p.id === periodIds[periodIds.length - 1]);
      if (period) {
        setSelectedPeriod(period);
      }
    } else {
      // No months selected - keep current or clear
    }
  };

  const handleStatusToggle = (status: DocumentStatus) => {
    if (!onStatusChange) return;
    
    if (statusList.includes(status)) {
      onStatusChange(statusList.filter(s => s !== status));
    } else {
      onStatusChange([...statusList, status]);
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* View Mode Toggle */}
      {showViewModeToggle && onViewModeChange && (
        <ViewModeToggle
          value={viewMode}
          onChange={onViewModeChange}
          availableModes={availableViewModes}
        />
      )}

      {/* Hierarchical Date Picker */}
      <HierarchicalDatePicker
        periods={periods}
        selectedYear={selectedYear}
        selectedMonthPeriodIds={selectedMonthPeriodIds}
        onYearChange={handleYearChange}
        onMonthsChange={handleMonthsChange}
      />

      {/* Dimension Selectors */}
      {showDimensionSelectors && (
        <div className="flex items-center gap-3">
          <DimensionSelector
            label="Row"
            value={pivotRowDimension ?? null}
            onChange={onRowDimensionChange || (() => {})}
            excludeDimensions={pivotColDimension ? [pivotColDimension] : []}
          />
          <DimensionSelector
            label="Column"
            value={pivotColDimension ?? null}
            onChange={onColDimensionChange || (() => {})}
            excludeDimensions={pivotRowDimension ? [pivotRowDimension] : []}
          />
        </div>
      )}

      {/* Status Filter */}
      {showStatusFilter && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <div className="flex items-center gap-3">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <div key={value} className="flex items-center gap-1.5">
                <Checkbox
                  id={`status-${value}`}
                  checked={statusList.includes(value)}
                  onCheckedChange={() => handleStatusToggle(value)}
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor={`status-${value}`}
                  className="text-xs font-normal cursor-pointer"
                >
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { ViewMode };

