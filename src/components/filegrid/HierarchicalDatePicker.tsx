import { useMemo } from 'react';
import { Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Period } from '@/types/filegrid';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface HierarchicalDatePickerProps {
  periods: Period[];
  selectedYear: string | null;
  selectedMonthPeriodIds: string[];
  onYearChange: (year: string | null) => void;
  onMonthsChange: (periodIds: string[]) => void;
}

export function HierarchicalDatePicker({
  periods,
  selectedYear,
  selectedMonthPeriodIds,
  onYearChange,
  onMonthsChange,
}: HierarchicalDatePickerProps) {
  // Extract unique years from periods (from start_date)
  const years = useMemo(() => {
    const yearSet = new Set<string>();
    periods.forEach((p) => {
      if (p.type === 'month' || p.type === 'year') {
        const year = p.start_date.substring(0, 4);
        yearSet.add(year);
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a)); // Most recent first
  }, [periods]);

  // Filter month periods for selected year
  const monthPeriods = useMemo(() => {
    if (!selectedYear) return [];
    return periods
      .filter((p) => p.type === 'month' && p.start_date.startsWith(selectedYear))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [periods, selectedYear]);

  // Parse month index from period label (e.g., "2025-01" → 0)
  const getMonthIndex = (period: Period): number => {
    const match = period.label.match(/-(\d{2})$/);
    return match ? parseInt(match[1], 10) - 1 : 0;
  };

  const handleYearChange = (year: string) => {
    onYearChange(year === 'all' ? null : year);
    onMonthsChange([]); // Clear month selections when year changes
  };

  const handleMonthToggle = (periodId: string, checked: boolean) => {
    if (checked) {
      onMonthsChange([...selectedMonthPeriodIds, periodId]);
    } else {
      onMonthsChange(selectedMonthPeriodIds.filter((id) => id !== periodId));
    }
  };

  const handleSelectAll = () => {
    const allMonthIds = monthPeriods.map((p) => p.id);
    onMonthsChange(allMonthIds);
  };

  const handleClearAll = () => {
    onMonthsChange([]);
  };

  const allSelected = monthPeriods.length > 0 && 
    monthPeriods.every((p) => selectedMonthPeriodIds.includes(p.id));

  const selectedCount = selectedMonthPeriodIds.length;

  return (
    <div className="flex items-center gap-2">
      {/* Year Selector */}
      <Select
        value={selectedYear ?? 'all'}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="h-8 w-[100px] bg-background">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Multi-Select Popover */}
      {selectedYear && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-sm"
            >
              <Calendar className="h-3.5 w-3.5" />
              {selectedCount === 0
                ? 'Select months'
                : selectedCount === monthPeriods.length
                ? 'All months'
                : `${selectedCount} month${selectedCount > 1 ? 's' : ''}`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              {/* Header with actions */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Months in {selectedYear}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleSelectAll}
                    disabled={allSelected}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleClearAll}
                    disabled={selectedCount === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-4 gap-2">
                {monthPeriods.map((period) => {
                  const monthIndex = getMonthIndex(period);
                  const monthLabel = MONTH_LABELS[monthIndex] || period.label;
                  const isChecked = selectedMonthPeriodIds.includes(period.id);

                  return (
                    <div key={period.id} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`month-${period.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleMonthToggle(period.id, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`month-${period.id}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {monthLabel}
                      </Label>
                    </div>
                  );
                })}
              </div>

              {monthPeriods.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No month periods available for {selectedYear}
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
