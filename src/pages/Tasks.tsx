import { useModule } from '@/contexts/ModuleContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckSquare } from 'lucide-react';

export default function TasksModule() {
  const { selectedEntity } = useModule();

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-medium">
            {selectedEntity?.name ?? 'Tasks'} — Task Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Coming in Phase 3
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CheckSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Task Management</h3>
          <p className="mt-2 max-w-md text-muted-foreground">
            Task management with list and calendar views will be implemented in Phase 3.
            Tasks will be linked to the structural hierarchy and can reference documents, 
            PBC items, and reconciliations.
          </p>
        </div>
      </ScrollArea>
    </main>
  );
}
