import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { TaskChecklistItem, TaskChecklistSection, TaskItemStatus, ChecklistMode } from '@/types/task-checklists';

interface ChecklistItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ChecklistMode;
  sections: TaskChecklistSection[];
  item?: TaskChecklistItem | null;
  defaultSectionId?: string | null;
  hasRelativeDays?: boolean;
  onSave: (data: {
    title: string;
    description?: string;
    section_id?: string | null;
    due_date?: string | null;
    relative_day?: number | null;
    status?: TaskItemStatus;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ChecklistItemModal({
  open,
  onOpenChange,
  mode,
  sections,
  item,
  defaultSectionId,
  hasRelativeDays = false,
  onSave,
  isLoading,
}: ChecklistItemModalProps) {
  const isEditing = !!item;

  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [sectionId, setSectionId] = useState<string | null>(item?.section_id ?? defaultSectionId ?? null);
  const [dueDate, setDueDate] = useState(item?.due_date ?? '');
  const [relativeDay, setRelativeDay] = useState<string>(item?.relative_day?.toString() ?? '');
  const [status, setStatus] = useState<TaskItemStatus>(item?.status ?? 'todo');

  const handleSubmit = async () => {
    if (!title.trim()) return;

    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      section_id: mode === 'structured_list' ? sectionId : null,
      due_date: hasRelativeDays ? undefined : (dueDate || undefined),
      relative_day: hasRelativeDays && relativeDay ? parseInt(relativeDay, 10) : undefined,
      status: isEditing ? status : 'todo',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSectionId(null);
    setDueDate('');
    setRelativeDay('');
    setStatus('todo');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Add Task'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the task details below.'
              : 'Add a new task to the checklist.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          {/* Section (structured mode only) */}
          {mode === 'structured_list' && sections.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={sectionId ?? 'none'}
                onValueChange={(v) => setSectionId(v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No section</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due Date or Relative Day */}
          {hasRelativeDays ? (
            <div className="space-y-2">
              <Label htmlFor="relativeDay">Relative Day</Label>
              <Input
                id="relativeDay"
                type="number"
                min="0"
                value={relativeDay}
                onChange={(e) => setRelativeDay(e.target.value)}
                placeholder="e.g., 0 for Day 0, 5 for Day 5"
              />
              <p className="text-xs text-muted-foreground">
                Enter the day number relative to the close start date
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}

          {/* Status (edit mode only) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskItemStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
