import { useMemo, useState } from 'react';
import { AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useModule } from '@/contexts/ModuleContext';
import { useEntities } from '@/hooks/useEntities';
import { usePeriods } from '@/hooks/usePeriods';
import { useAllObjectsForEntity } from '@/hooks/useObjects';
import { createStarterTemplate } from '@/lib/starterTemplate';
import { toast } from '@/hooks/use-toast';

interface WhyEmptyPanelProps {
  show: boolean;
  contextLabel?: string;
}

export function WhyEmptyPanel({ show, contextLabel = 'this page' }: WhyEmptyPanelProps) {
  const { selectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { data: entities = [] } = useEntities();
  const { data: periods = [] } = usePeriods();
  const { data: objects = [] } = useAllObjectsForEntity(selectedEntity?.id || null);
  const [creating, setCreating] = useState(false);

  const latestPeriod = useMemo(() => {
    if (periods.length === 0) return null;
    return [...periods].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
  }, [periods]);

  if (!show) return null;

  const reasons: string[] = [];
  if (entities.length === 0) reasons.push('You do not have access to any entities yet.');
  if (!selectedPeriod) reasons.push('No period selected.');
  if (selectedEntity && objects.length === 0) reasons.push('No objects exist for the selected entity.');
  if (reasons.length === 0) reasons.push(`No records match the current filters for ${contextLabel}.`);

  const handleSelectLatestPeriod = () => {
    if (latestPeriod) setSelectedPeriod(latestPeriod);
  };

  const handleCreateStarter = async () => {
    if (!selectedEntity) return;
    setCreating(true);
    try {
      await createStarterTemplate({ entityId: selectedEntity.id, periodId: selectedPeriod?.id || null });
      toast({ title: 'Starter template created', description: 'Monthly Close process, areas, objects, and checklist added.' });
    } catch (error) {
      console.error('Starter template failed', error);
      toast({ title: 'Starter template failed', description: 'Could not create starter template.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center gap-2">
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm">Why is {contextLabel} empty?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ul className="space-y-1 text-muted-foreground">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              {reason}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {!selectedPeriod && latestPeriod && (
            <Button variant="outline" size="sm" onClick={handleSelectLatestPeriod}>
              Select latest period
            </Button>
          )}
          {selectedEntity && objects.length === 0 && (
            <Button size="sm" onClick={handleCreateStarter} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Create starter template
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
