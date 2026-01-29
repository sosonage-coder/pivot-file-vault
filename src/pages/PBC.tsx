import { useState } from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { PBCListView } from '@/components/filegrid/PBCListView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, LayoutList, Kanban, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PBCViewType = 'list' | 'kanban' | 'assignee';

export default function PBCModule() {
  const { selectedEntity } = useModule();
  const { isExternalReviewer } = useAuth();
  const [currentView, setCurrentView] = useState<PBCViewType>('list');

  if (!selectedEntity) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Select an entity to view PBC requests</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-medium">{selectedEntity.name} — PBC Requests</h2>
          <p className="text-sm text-muted-foreground">
            Manage document requests and track fulfillment status
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle - placeholder for future views */}
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as PBCViewType)}>
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2" disabled>
                <Kanban className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="assignee" className="gap-2" disabled>
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">By Assignee</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {!isExternalReviewer && (
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {currentView === 'list' && <PBCListView entity={selectedEntity} />}
        {currentView === 'kanban' && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Kanban view coming soon...
          </div>
        )}
        {currentView === 'assignee' && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            By Assignee view coming soon...
          </div>
        )}
      </ScrollArea>
    </main>
  );
}
