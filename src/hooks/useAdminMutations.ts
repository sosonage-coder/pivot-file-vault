import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Entity, Process, Area } from '@/types/filegrid';

interface CreateEntityData {
  name: string;
}

interface CreateProcessData {
  name: string;
  entity_id: string;
  department_id: string;
  template_id: string;
}

export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEntityData) => {
      const { data: entity, error } = await supabase
        .from('entities')
        .insert({
          name: data.name,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return entity as Entity;
    },
    onSuccess: (entity) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success(`Entity "${entity.name}" created successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to create entity: ${error.message}`);
    },
  });
}

export function useCreateProcessFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProcessData) => {
      // 1. Create the process
      const { data: process, error: processError } = await supabase
        .from('processes')
        .insert({
          name: data.name,
          entity_id: data.entity_id,
          department_id: data.department_id,
          template_id: data.template_id,
        })
        .select()
        .single();

      if (processError) throw processError;

      // 2. Fetch area templates for this process template
      const { data: areaTemplates, error: templatesError } = await supabase
        .from('area_templates')
        .select('*')
        .eq('process_template_id', data.template_id);

      if (templatesError) throw templatesError;

      // 3. Create areas from templates
      if (areaTemplates && areaTemplates.length > 0) {
        const areasToCreate = areaTemplates.map((template) => ({
          name: template.name,
          process_id: process.id,
          template_id: template.id,
        }));

        const { error: areasError } = await supabase
          .from('areas')
          .insert(areasToCreate);

        if (areasError) throw areasError;
      }

      return process as Process;
    },
    onSuccess: (process) => {
      queryClient.invalidateQueries({ queryKey: ['folder-structure'] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast.success(`Process "${process.name}" created with areas from template`);
    },
    onError: (error) => {
      toast.error(`Failed to create process: ${error.message}`);
    },
  });
}

export function useDepartments() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function useProcessTemplates() {
  return useMutation({
    mutationFn: async (departmentId: string) => {
      const { data, error } = await supabase
        .from('process_templates')
        .select('*')
        .eq('department_id', departmentId)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}
