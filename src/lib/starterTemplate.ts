import { supabase } from '@/integrations/supabase/client';

const DEFAULT_AREAS = [
  'Cash',
  'Accounts Payable',
  'Accounts Receivable',
  'Accruals',
  'Fixed Assets',
  'Revenue',
];

const DEFAULT_OBJECTS: Record<string, string[]> = {
  Cash: ['Operating Cash', 'Payroll Cash'],
  'Accounts Payable': ['Trade Payables'],
  'Accounts Receivable': ['Customer Receivables'],
  Accruals: ['Accrued Expenses'],
  'Fixed Assets': ['Property & Equipment'],
  Revenue: ['Product Revenue'],
};

const DEFAULT_TASKS = [
  'Tie out cash and confirm variances',
  'Review accrual roll-forward',
  'Validate revenue recognition support',
  'Confirm AP/AR aging completeness',
  'Upload support package for key accounts',
];

interface StarterTemplateInput {
  entityId: string;
  periodId?: string | null;
}

export async function createStarterTemplate({ entityId, periodId }: StarterTemplateInput) {
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id')
    .order('name')
    .limit(1);

  if (deptError) throw deptError;
  if (!departments?.length) throw new Error('No departments available. Please create a department first.');

  const departmentId = departments[0].id;

  const { data: existingProcess } = await supabase
    .from('processes')
    .select('id')
    .eq('entity_id', entityId)
    .eq('name', 'Monthly Close')
    .maybeSingle();

  let processId = existingProcess?.id as string | undefined;

  if (!processId) {
    const { data: process, error: processError } = await supabase
      .from('processes')
      .insert({
        name: 'Monthly Close',
        entity_id: entityId,
        department_id: departmentId,
        template_id: null,
      })
      .select('id')
      .single();

    if (processError) throw processError;
    processId = process.id;
  }

  const { data: existingAreas } = await supabase
    .from('areas')
    .select('id, name')
    .eq('process_id', processId);

  const existingAreaMap = new Map((existingAreas || []).map((area) => [area.name, area.id]));
  const createdAreaIds: Record<string, string> = { ...Object.fromEntries(existingAreaMap) };

  const areasToCreate = DEFAULT_AREAS.filter((name) => !existingAreaMap.has(name)).map((name) => ({
    name,
    process_id: processId,
  }));

  if (areasToCreate.length > 0) {
    const { data: newAreas, error: areasError } = await supabase
      .from('areas')
      .insert(areasToCreate)
      .select('id, name');

    if (areasError) throw areasError;
    newAreas?.forEach((area) => {
      createdAreaIds[area.name] = area.id;
    });
  }

  const { data: existingObjects } = await supabase
    .from('objects')
    .select('id, name, area_id')
    .eq('entity_id', entityId);

  const existingObjectSet = new Set((existingObjects || []).map((obj) => `${obj.area_id}:${obj.name}`));
  const objectsToCreate: Array<{ name: string; entity_id: string; department_id: string; process_id: string; area_id: string }> = [];

  Object.entries(DEFAULT_OBJECTS).forEach(([areaName, objectNames]) => {
    const areaId = createdAreaIds[areaName];
    if (!areaId) return;
    objectNames.forEach((objectName) => {
      const key = `${areaId}:${objectName}`;
      if (!existingObjectSet.has(key)) {
        objectsToCreate.push({
          name: objectName,
          entity_id: entityId,
          department_id: departmentId,
          process_id: processId,
          area_id: areaId,
        });
      }
    });
  });

  if (objectsToCreate.length > 0) {
    const { error: objectsError } = await supabase
      .from('objects')
      .insert(objectsToCreate);

    if (objectsError) throw objectsError;
  }

  const { data: existingChecklist } = await supabase
    .from('task_checklists')
    .select('id')
    .eq('entity_id', entityId)
    .eq('name', 'Monthly Close Checklist')
    .maybeSingle();

  if (!existingChecklist) {
    const { data: checklist, error: checklistError } = await supabase
      .from('task_checklists')
      .insert({
        entity_id: entityId,
        department_id: departmentId,
        period_id: periodId || null,
        name: 'Monthly Close Checklist',
        description: 'Starter checklist for month-end close.',
        mode: 'structured_list',
        is_template: false,
        template_id: null,
      })
      .select('id')
      .single();

    if (checklistError) throw checklistError;

    const { data: section, error: sectionError } = await supabase
      .from('task_checklist_sections')
      .insert({
        checklist_id: checklist.id,
        name: 'Close Tasks',
        sort_order: 1,
      })
      .select('id')
      .single();

    if (sectionError) throw sectionError;

    const itemsPayload = DEFAULT_TASKS.map((title, index) => ({
      checklist_id: checklist.id,
      section_id: section.id,
      title,
      sort_order: index + 1,
      status: 'todo',
    }));

    const { error: itemsError } = await supabase
      .from('task_checklist_items')
      .insert(itemsPayload);

    if (itemsError) throw itemsError;
  }

  return {
    processId,
    areasCreated: areasToCreate.length,
    objectsCreated: objectsToCreate.length,
  };
}
