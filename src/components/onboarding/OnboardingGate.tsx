import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useModule } from '@/contexts/ModuleContext';
import { useEntities } from '@/hooks/useEntities';
import { usePeriods } from '@/hooks/usePeriods';
import { useAllObjectsForEntity } from '@/hooks/useObjects';
import { useCreateEntity } from '@/hooks/useAdminMutations';
import { createStarterTemplate } from '@/lib/starterTemplate';
import { toast } from '@/hooks/use-toast';

const ONBOARDING_KEY = 'onboarding-complete';

export function OnboardingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEntity, setSelectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { data: entities = [] } = useEntities();
  const { data: periods = [] } = usePeriods();
  const { data: objects = [] } = useAllObjectsForEntity(selectedEntity?.id || null);
  const createEntity = useCreateEntity();

  const [entityName, setEntityName] = useState('Acme Corp');
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const latestPeriod = useMemo(() => {
    if (periods.length === 0) return null;
    return [...periods].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
  }, [periods]);

  const needsEntity = entities.length === 0;
  const needsPeriod = !selectedPeriod;
  const needsObjects = !!selectedEntity && objects.length === 0;

  const onboardingComplete = localStorage.getItem(ONBOARDING_KEY) === 'true';
  const shouldOpen = !!user && (!onboardingComplete || needsEntity || needsPeriod || needsObjects);

  const handleCreateEntity = async () => {
    if (!entityName.trim()) return;
    try {
      const entity = await createEntity.mutateAsync({ name: entityName.trim() });
      setSelectedEntity(entity);
    } catch (error) {
      console.error('Create entity failed', error);
    }
  };

  const handleSelectLatestPeriod = () => {
    if (latestPeriod) {
      setSelectedPeriod(latestPeriod);
    }
  };

  const handleCreateStarter = async () => {
    if (!selectedEntity) return;
    setCreatingTemplate(true);
    try {
      await createStarterTemplate({ entityId: selectedEntity.id, periodId: selectedPeriod?.id || null });
      toast({ title: 'Starter template created', description: 'Monthly Close process, areas, objects, and checklist added.' });
    } catch (error) {
      console.error('Starter template failed', error);
      toast({ title: 'Starter template failed', description: 'Could not create starter template.', variant: 'destructive' });
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    navigate('/command-center');
  };

  return (
    <Dialog open={shouldOpen}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Get FileGRID ready</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Step 1 — Join or create an entity</h4>
            {entities.length > 0 ? (
              <Select
                value={selectedEntity?.id || ''}
                onValueChange={(value) => {
                  const entity = entities.find((item) => item.id === value) || null;
                  if (entity) setSelectedEntity(entity);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Entity name" />
                <Button onClick={handleCreateEntity} disabled={createEntity.isPending}>
                  {createEntity.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Step 2 — Select a period</h4>
            <div className="flex gap-2">
              <Select
                value={selectedPeriod?.id || ''}
                onValueChange={(value) => {
                  const period = periods.find((item) => item.id === value) || null;
                  if (period) setSelectedPeriod(period);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSelectLatestPeriod} disabled={!latestPeriod}>
                Use latest
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Step 3 — Create starter structure</h4>
            <p className="text-sm text-muted-foreground">
              Adds Monthly Close process, Cash/AP/AR/Accruals/FA/Revenue areas, sample objects, and a checklist.
            </p>
            <Button onClick={handleCreateStarter} disabled={!selectedEntity || creatingTemplate || objects.length > 0}>
              {creatingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {objects.length > 0 ? 'Starter already created' : 'Create starter template'}
            </Button>
          </div>

          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Step 4 — Launch Command Center
            </div>
            <p className="mt-1 text-muted-foreground">
              You can revisit this later from any empty state.
            </p>
            <Button className="mt-3" onClick={handleFinish} disabled={needsEntity || needsPeriod || needsObjects}>
              Go to Command Center
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
