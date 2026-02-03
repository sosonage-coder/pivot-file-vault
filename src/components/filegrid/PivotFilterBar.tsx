import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePeriods } from '@/hooks/usePeriods';
import { HierarchicalDatePicker } from './HierarchicalDatePicker';
import { DimensionSelector, type PivotDimension } from './DimensionSelector';
import type { DocumentStatus, PivotFilters, TreeNode } from '@/types/filegrid';

const ALL_STATUSES: DocumentStatus[] = ['Draft', 'Final', 'Superseded', 'Archived'];

interface PivotFilterBarProps {
  filters: PivotFilters;
  onFiltersChange: (filters: PivotFilters) => void;
  areas: TreeNode[];
  showDimensionSelectors?: boolean;
}

export function PivotFilterBar({ 
  filters, 
  onFiltersChange, 
  areas,
  showDimensionSelectors = false,
}: PivotFilterBarProps) {
  const { data: periods = [] } = usePeriods();

  const handleStatusToggle = (status: DocumentStatus, checked: boolean) => {
    const newStatusList = checked
      ? [...filters.statusList, status]
      : filters.statusList.filter((s) => s !== status);
    onFiltersChange({ ...filters, statusList: newStatusList });
  };

  const handleYearChange = (year: string | null) => {
    onFiltersChange({
      ...filters,
      selectedYear: year,
      selectedMonthPeriodIds: [],
      periodId: null, // Clear legacy single period when using hierarchical
    });
  };

  const handleMonthsChange = (periodIds: string[]) => {
    onFiltersChange({
      ...filters,
      selectedMonthPeriodIds: periodIds,
      periodId: null, // Clear legacy single period
    });
  };

  const handleAreaChange = (value: string) => {
    onFiltersChange({
      ...filters,
      areaId: value === 'all' ? null : value,
      objectId: null, // Reset object when area changes
    });
  };

  const handleRowDimensionChange = (dimension: PivotDimension | null) => {
    onFiltersChange({
      ...filters,
      pivotRowDimension: dimension ?? undefined,
    });
  };

  const handleColDimensionChange = (dimension: PivotDimension | null) => {
    onFiltersChange({
      ...filters,
      pivotColDimension: dimension ?? undefined,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      statusList: [],
      selectedYear: null,
      selectedMonthPeriodIds: [],
      periodId: null,
      areaId: null,
      objectId: null,
      pivotRowDimension: undefined,
      pivotColDimension: undefined,
    });
  };

  const hasActiveFilters =
    filters.statusList.length > 0 ||
    filters.selectedYear !== null ||
    filters.selectedMonthPeriodIds.length > 0 ||
    filters.periodId !== null ||
    filters.areaId !== null ||
    filters.pivotRowDimension !== undefined ||
    filters.pivotColDimension !== undefined;

  // Collect all area nodes from the tree
  const allAreas = areas.flatMap((dept) =>
    (dept.children || []).flatMap((process) =>
      (process.children || []).filter((node) => node.type === 'area')
    )
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      {/* Dimension Selectors Row (optional) */}
      {showDimensionSelectors && (
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Dimensions:</span>
          <DimensionSelector
            label="Row"
            value={filters.pivotRowDimension ?? null}
            onChange={handleRowDimensionChange}
            excludeDimensions={filters.pivotColDimension ? [filters.pivotColDimension] : []}
          />
          <DimensionSelector
            label="Column"
            value={filters.pivotColDimension ?? null}
            onChange={handleColDimensionChange}
            excludeDimensions={filters.pivotRowDimension ? [filters.pivotRowDimension] : []}
          />
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        {/* Status checkboxes */}
        <div className="flex items-center gap-3">
          {ALL_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <Checkbox
                id={`status-${status}`}
                checked={filters.statusList.includes(status)}
                onCheckedChange={(checked) =>
                  handleStatusToggle(status, checked === true)
                }
              />
              <Label
                htmlFor={`status-${status}`}
                className="text-sm font-normal cursor-pointer"
              >
                {status}
              </Label>
            </div>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Hierarchical Date Picker (Year → Month multi-select) */}
        <HierarchicalDatePicker
          periods={periods}
          selectedYear={filters.selectedYear}
          selectedMonthPeriodIds={filters.selectedMonthPeriodIds}
          onYearChange={handleYearChange}
          onMonthsChange={handleMonthsChange}
        />

        <div className="h-6 w-px bg-border" />

        {/* Area dropdown */}
        <Select
          value={filters.areaId ?? 'all'}
          onValueChange={handleAreaChange}
        >
          <SelectTrigger className="h-8 w-[180px] bg-background">
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {allAreas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
