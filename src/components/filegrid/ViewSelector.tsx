import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutGrid, 
  Calendar, 
  Box, 
  FolderOpen, 
  FileType, 
  CheckCircle,
  FileQuestion,
  ClipboardList
} from 'lucide-react';
import type { PivotViewType, AnalysisViewType } from '@/types/filegrid';

type ViewType = 'folder' | PivotViewType | AnalysisViewType;

interface ViewSelectorProps {
  value: ViewType;
  onChange: (value: ViewType) => void;
}

const viewOptions: { value: ViewType; label: string; icon: React.ElementType; group: 'views' | 'analysis' }[] = [
  { value: 'folder', label: 'Folder View', icon: LayoutGrid, group: 'views' },
  { value: 'period-area-object', label: 'By Period', icon: Calendar, group: 'views' },
  { value: 'object-period', label: 'By Object', icon: Box, group: 'views' },
  { value: 'area-period', label: 'By Area', icon: FolderOpen, group: 'views' },
  { value: 'document-type', label: 'By Document Type', icon: FileType, group: 'views' },
  { value: 'status-final', label: 'Final Only', icon: CheckCircle, group: 'views' },
  { value: 'whats-missing', label: "What's Missing", icon: FileQuestion, group: 'analysis' },
  { value: 'pbc-requests', label: 'PBC Requests', icon: ClipboardList, group: 'analysis' },
];

export function ViewSelector({ value, onChange }: ViewSelectorProps) {
  const selectedOption = viewOptions.find(opt => opt.value === value);
  const Icon = selectedOption?.icon || LayoutGrid;

  const viewsGroup = viewOptions.filter(o => o.group === 'views');
  const analysisGroup = viewOptions.filter(o => o.group === 'analysis');

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <SelectValue placeholder="Select view..." />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover">
        {viewsGroup.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <option.icon className="h-4 w-4" />
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
        <Separator className="my-1" />
        {analysisGroup.map((option) => (
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
