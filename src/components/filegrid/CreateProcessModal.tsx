import { useState, useEffect } from 'react';
import { FolderGit2, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProcessFromTemplate } from '@/hooks/useAdminMutations';
import type { Entity, Department, ProcessTemplate } from '@/types/filegrid';

interface CreateProcessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity;
}

type Step = 'department' | 'template' | 'name';

export function CreateProcessModal({ open, onOpenChange, entity }: CreateProcessModalProps) {
  const [step, setStep] = useState<Step>('department');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null);
  const [processName, setProcessName] = useState('');

  const createProcess = useCreateProcessFromTemplate();

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Department[];
    },
    enabled: open,
  });

  // Fetch process templates for selected department
  const { data: templates } = useQuery({
    queryKey: ['process-templates', selectedDepartment?.id],
    queryFn: async () => {
      if (!selectedDepartment) return [];
      const { data, error } = await supabase
        .from('process_templates')
        .select('*')
        .eq('department_id', selectedDepartment.id)
        .order('name');
      if (error) throw error;
      return data as ProcessTemplate[];
    },
    enabled: !!selectedDepartment,
  });

  // Pre-fill process name from template
  useEffect(() => {
    if (selectedTemplate) {
      setProcessName(selectedTemplate.name);
    }
  }, [selectedTemplate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('department');
      setSelectedDepartment(null);
      setSelectedTemplate(null);
      setProcessName('');
    }
  }, [open]);

  const handleDepartmentSelect = (departmentId: string) => {
    const dept = departments?.find((d) => d.id === departmentId);
    if (dept) {
      setSelectedDepartment(dept);
      setStep('template');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setStep('name');
    }
  };

  const handleBack = () => {
    if (step === 'template') {
      setStep('department');
      setSelectedDepartment(null);
    } else if (step === 'name') {
      setStep('template');
      setSelectedTemplate(null);
      setProcessName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartment || !selectedTemplate || !processName.trim()) return;

    try {
      await createProcess.mutateAsync({
        name: processName.trim(),
        entity_id: entity.id,
        department_id: selectedDepartment.id,
        template_id: selectedTemplate.id,
      });
      onOpenChange(false);
    } catch {
      // Error handled in mutation
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <span className={step === 'department' ? 'text-primary font-medium' : ''}>
        Department
      </span>
      <ChevronRight className="h-4 w-4" />
      <span className={step === 'template' ? 'text-primary font-medium' : ''}>
        Template
      </span>
      <ChevronRight className="h-4 w-4" />
      <span className={step === 'name' ? 'text-primary font-medium' : ''}>
        Name
      </span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5" />
            Create Process from Template
          </DialogTitle>
          <DialogDescription>
            Create a new process for <strong>{entity.name}</strong> using a predefined template.
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            {step === 'department' && (
              <div className="space-y-2">
                <Label>Select Department</Label>
                <Select onValueChange={handleDepartmentSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 'template' && (
              <div className="space-y-2">
                <Label>Select Process Template</Label>
                <p className="text-sm text-muted-foreground">
                  Department: <strong>{selectedDepartment?.name}</strong>
                </p>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 'name' && (
              <div className="space-y-2">
                <Label htmlFor="process-name">Process Name</Label>
                <p className="text-sm text-muted-foreground">
                  Using template: <strong>{selectedTemplate?.name}</strong>
                </p>
                <Input
                  id="process-name"
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                  placeholder="e.g., Monthly Close"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This will create the process with all areas from the template.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {step !== 'department' && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {step === 'name' && (
              <Button
                type="submit"
                disabled={!processName.trim() || createProcess.isPending}
              >
                {createProcess.isPending ? 'Creating...' : 'Create Process'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
