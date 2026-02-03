import { Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PivotDimension = 'period' | 'area' | 'object' | 'status' | 'document-type';

interface DimensionOption {
  value: PivotDimension;
  label: string;
}

const DIMENSION_OPTIONS: DimensionOption[] = [
  { value: 'period', label: 'Period' },
  { value: 'area', label: 'Area' },
  { value: 'object', label: 'Object' },
  { value: 'status', label: 'Status' },
  { value: 'document-type', label: 'Document Type' },
];

interface DimensionSelectorProps {
  label: string;
  value: PivotDimension | null;
  onChange: (dimension: PivotDimension | null) => void;
  excludeDimensions?: PivotDimension[];
  placeholder?: string;
}

export function DimensionSelector({
  label,
  value,
  onChange,
  excludeDimensions = [],
  placeholder = 'Select...',
}: DimensionSelectorProps) {
  const availableOptions = DIMENSION_OPTIONS.filter(
    (opt) => !excludeDimensions.includes(opt.value)
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {label}:
      </span>
      <Select
        value={value ?? 'none'}
        onValueChange={(val) => onChange(val === 'none' ? null : (val as PivotDimension))}
      >
        <SelectTrigger className="h-8 w-[130px] bg-background">
          <Layers className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {availableOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
