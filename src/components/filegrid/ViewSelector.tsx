import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LayoutGrid, 
  Calendar, 
  Box, 
  FolderOpen, 
  FileType, 
  CheckCircle 
} from 'lucide-react';
import type { PivotViewType } from '@/types/filegrid';

type ViewType = 'folder' | PivotViewType;

interface ViewSelectorProps {
  value: ViewType;
  onChange: (value: ViewType) => void;
}

const viewOptions: { value: ViewType; label: string; icon: React.ElementType }[] = [
  { value: 'folder', label: 'Folder View', icon: LayoutGrid },
  { value: 'period-area-object', label: 'By Period', icon: Calendar },
  { value: 'object-period', label: 'By Object', icon: Box },
  { value: 'area-period', label: 'By Area', icon: FolderOpen },
  { value: 'document-type', label: 'By Document Type', icon: FileType },
  { value: 'status-final', label: 'Final Only', icon: CheckCircle },
];

export function ViewSelector({ value, onChange }: ViewSelectorProps) {
  const selectedOption = viewOptions.find(opt => opt.value === value);
  const Icon = selectedOption?.icon || LayoutGrid;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <SelectValue placeholder="Select view..." />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover">
        {viewOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <option.icon className="h-4 w-4" />
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type { ViewType };
