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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { ChecklistMode } from '@/types/task-checklists';

interface CreateChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description?: string;
    mode: ChecklistMode;
    start_date?: string;
    duration_days?: number;
    is_template?: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateChecklistModal({
  open,
  onOpenChange,
  onSave,
  isLoading,
}: CreateChecklistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<ChecklistMode>('quick_list');
  const [isCloseSchedule, setIsCloseSchedule] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [durationDays, setDurationDays] = useState('10');
  const [isTemplate, setIsTemplate] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      mode,
      start_date: isCloseSchedule && startDate ? startDate : undefined,
      duration_days: isCloseSchedule && durationDays ? parseInt(durationDays, 10) : undefined,
      is_template: isTemplate,
    });

    // Reset form
    setName('');
    setDescription('');
    setMode('quick_list');
    setIsCloseSchedule(false);
    setStartDate('');
    setDurationDays('10');
    setIsTemplate(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Checklist</DialogTitle>
          <DialogDescription>
            Create a new checklist to track tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Close Checklist"
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

          {/* Mode Selection */}
          <div className="space-y-3">
            <Label>Checklist Mode</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as ChecklistMode)}>
              <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                   onClick={() => setMode('quick_list')}>
                <RadioGroupItem value="quick_list" id="quick_list" className="mt-1" />
                <div>
                  <Label htmlFor="quick_list" className="font-medium cursor-pointer">
                    Quick List
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Flat task list with no sections. Best for daily or simple checklists.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                   onClick={() => setMode('structured_list')}>
                <RadioGroupItem value="structured_list" id="structured_list" className="mt-1" />
                <div>
                  <Label htmlFor="structured_list" className="font-medium cursor-pointer">
                    Structured List
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tasks grouped into sections. Best for multi-step workflows.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Close Schedule Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="close-schedule">Close Schedule</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable relative day scheduling (Day 0, Day 1, etc.)
              </p>
            </div>
            <Switch
              id="close-schedule"
              checked={isCloseSchedule}
              onCheckedChange={setIsCloseSchedule}
            />
          </div>

          {/* Close Schedule Options */}
          {isCloseSchedule && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationDays">Duration (days)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Template Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="is-template">Save as Template</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow this checklist to be reused for future periods
              </p>
            </div>
            <Switch
              id="is-template"
              checked={isTemplate}
              onCheckedChange={setIsTemplate}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
