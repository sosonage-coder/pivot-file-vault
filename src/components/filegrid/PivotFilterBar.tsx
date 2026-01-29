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
import type { DocumentStatus, PivotFilters, Period, TreeNode } from '@/types/filegrid';

const ALL_STATUSES: DocumentStatus[] = ['Draft', 'Final', 'Superseded', 'Archived'];

interface PivotFilterBarProps {
  filters: PivotFilters;
  onFiltersChange: (filters: PivotFilters) => void;
  areas: TreeNode[];
}

export function PivotFilterBar({ filters, onFiltersChange, areas }: PivotFilterBarProps) {
  const { data: periods } = usePeriods();

  const handleStatusToggle = (status: DocumentStatus, checked: boolean) => {
    const newStatusList = checked
      ? [...filters.statusList, status]
      : filters.statusList.filter((s) => s !== status);
    onFiltersChange({ ...filters, statusList: newStatusList });
  };

  const handlePeriodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      periodId: value === 'all' ? null : value,
    });
  };

  const handleAreaChange = (value: string) => {
    onFiltersChange({
      ...filters,
      areaId: value === 'all' ? null : value,
      objectId: null, // Reset object when area changes
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      statusList: [],
      periodId: null,
      areaId: null,
      objectId: null,
    });
  };

  const hasActiveFilters =
    filters.statusList.length > 0 ||
    filters.periodId !== null ||
    filters.areaId !== null;

  // Collect all area nodes from the tree
  const allAreas = areas.flatMap((dept) =>
    (dept.children || []).flatMap((process) =>
      (process.children || []).filter((node) => node.type === 'area')
    )
  );

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-3">
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

      {/* Period dropdown */}
      <Select
        value={filters.periodId ?? 'all'}
        onValueChange={handlePeriodChange}
      >
        <SelectTrigger className="h-8 w-[160px] bg-background">
          <SelectValue placeholder="All Periods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Periods</SelectItem>
          {periods?.map((period: Period) => (
            <SelectItem key={period.id} value={period.id}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
  );
}
