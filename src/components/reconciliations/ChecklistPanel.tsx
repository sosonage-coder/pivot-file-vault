import { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle2,
  ListChecks,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useReconciliationChecklists,
  useChecklistTemplates,
  useCreateChecklistInstance,
  useDeleteChecklistInstance,
  useToggleChecklistItem
} from '@/hooks/useChecklists';
import type { ChecklistInstanceWithCompletions, ChecklistItem } from '@/types/checklists';

interface ChecklistPanelProps {
  reconciliationId: string;
  entityId: string;
  periodId: string | null;
  isEditable: boolean;
}

export function ChecklistPanel({ 
  reconciliationId, 
  entityId,
  periodId,
  isEditable 
}: ChecklistPanelProps) {
  const { data: checklists = [], isLoading } = useReconciliationChecklists(reconciliationId);
  const { data: templates = [] } = useChecklistTemplates();
  const createChecklist = useCreateChecklistInstance();
  const deleteChecklist = useDeleteChecklistInstance();
  const toggleItem = useToggleChecklistItem();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (checklists.length === 0) return { completed: 0, total: 0, percent: 0 };
    
    let completed = 0;
    let total = 0;
    
    checklists.forEach(checklist => {
      checklist.items.forEach((_, index) => {
        total++;
        const completion = checklist.completions.find(c => c.item_index === index);
        if (completion?.completed) completed++;
      });
    });
    
    return { 
      completed, 
      total, 
      percent: total > 0 ? Math.round((completed / total) * 100) : 0 
    };
  }, [checklists]);

  const handleAddChecklist = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    
    createChecklist.mutate({
      template_id: template.id,
      reconciliation_id: reconciliationId,
      entity_id: entityId,
      period_id: periodId || undefined,
      name: template.name,
      items: template.items,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setSelectedTemplateId('');
      }
    });
  };

  const handleDeleteChecklist = (checklistId: string) => {
    deleteChecklist.mutate({ 
      id: checklistId, 
      reconciliationId 
    });
  };

  const handleToggleItem = (checklist: ChecklistInstanceWithCompletions, itemIndex: number) => {
    const currentCompletion = checklist.completions.find(c => c.item_index === itemIndex);
    const newCompleted = !currentCompletion?.completed;
    
    toggleItem.mutate({
      instanceId: checklist.id,
      reconciliationId,
      itemIndex,
      completed: newCompleted,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Checklists</CardTitle>
              {overallProgress.total > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {overallProgress.completed} of {overallProgress.total} items complete
                </p>
              )}
            </div>
          </div>
          
          {isEditable && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Checklist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Checklist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Template</label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a checklist template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {template.items.length} items
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTemplateId && (
                      <p className="text-sm text-muted-foreground">
                        {templates.find(t => t.id === selectedTemplateId)?.description}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddChecklist}
                      disabled={!selectedTemplateId || createChecklist.isPending}
                    >
                      {createChecklist.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Checklist
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {overallProgress.total > 0 && (
          <Progress value={overallProgress.percent} className="mt-3 h-2" />
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {checklists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckSquare className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              No checklists attached
            </p>
            {isEditable && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Checklist
              </Button>
            )}
          </div>
        ) : (
          checklists.map(checklist => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              isEditable={isEditable}
              onDelete={() => handleDeleteChecklist(checklist.id)}
              onToggleItem={(itemIndex) => handleToggleItem(checklist, itemIndex)}
              isDeleting={deleteChecklist.isPending}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface ChecklistCardProps {
  checklist: ChecklistInstanceWithCompletions;
  isEditable: boolean;
  onDelete: () => void;
  onToggleItem: (itemIndex: number) => void;
  isDeleting: boolean;
}

function ChecklistCard({ 
  checklist, 
  isEditable, 
  onDelete, 
  onToggleItem,
  isDeleting 
}: ChecklistCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  // Calculate progress for this checklist
  const progress = useMemo(() => {
    const total = checklist.items.length;
    const completed = checklist.items.filter((_, index) => {
      const completion = checklist.completions.find(c => c.item_index === index);
      return completion?.completed;
    }).length;
    
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [checklist]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = new Map<string, { item: ChecklistItem; index: number }[]>();
    
    checklist.items.forEach((item, index) => {
      const category = item.category || 'General';
      const list = groups.get(category) || [];
      list.push({ item, index });
      groups.set(category, list);
    });
    
    return groups;
  }, [checklist.items]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium">{checklist.name}</span>
                <Badge 
                  variant={progress.percent === 100 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {progress.completed}/{progress.total}
                </Badge>
              </div>
              <Progress value={progress.percent} className="mt-1.5 h-1 w-32" />
            </div>
          </div>
          
          {isEditable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t divide-y">
            {Array.from(groupedItems.entries()).map(([category, items]) => (
              <div key={category} className="px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {category}
                </p>
                <div className="space-y-1">
                  {items.map(({ item, index }) => {
                    const completion = checklist.completions.find(c => c.item_index === index);
                    const isCompleted = completion?.completed || false;
                    
                    return (
                      <div 
                        key={index}
                        className={cn(
                          'flex items-start gap-3 py-1.5 px-2 rounded-md transition-colors',
                          isEditable && 'hover:bg-muted/50 cursor-pointer'
                        )}
                        onClick={() => isEditable && onToggleItem(index)}
                      >
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm',
                            isCompleted && 'line-through text-muted-foreground'
                          )}>
                            {item.label}
                            {item.required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
