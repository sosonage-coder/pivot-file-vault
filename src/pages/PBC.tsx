import { useState } from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePBCItems, usePBCStats } from '@/hooks/usePBCItems';
import { usePeriods } from '@/hooks/usePeriods';
import { PBCStatsCards } from '@/components/pbc/PBCStatsCards';
import { PBCEnhancedList } from '@/components/pbc/PBCEnhancedList';
import { PBCKanbanView } from '@/components/pbc/PBCKanbanView';
import { CreatePBCItemModal } from '@/components/filegrid/CreatePBCItemModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, LayoutList, Kanban, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PbcStatus } from '@/types/filegrid';

type PBCViewType = 'list' | 'kanban' | 'assignee';

export default function PBCModule() {
  const { selectedEntity } = useModule();
  const { isExternalReviewer } = useAuth();
  
  const [currentView, setCurrentView] = useState<PBCViewType>('list');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<PbcStatus | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const periodId = selectedPeriodId !== 'all' ? selectedPeriodId : null;

  const { data: periods = [] } = usePeriods();
  const { data: stats = { Requested: 0, Uploaded: 0, Reviewed: 0, Complete: 0, total: 0, overdue: 0 } } = 
    usePBCStats(selectedEntity?.id ?? null, periodId);
  const { data: items = [], isLoading } = usePBCItems({
    entityId: selectedEntity?.id ?? null,
    periodId,
    status: statusFilter,
  });

  const handleStatusCardClick = (status: PbcStatus | null) => {
    setStatusFilter(status);
  };

  if (!selectedEntity) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Select an entity to view PBC requests</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-medium">{selectedEntity.name} — PBC Requests</h2>
            <p className="text-sm text-muted-foreground">
              Manage document requests and track fulfillment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All periods</SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as PBCViewType)}>
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
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
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {/* Stats Dashboard */}
          <PBCStatsCards 
            stats={stats} 
            onStatusClick={handleStatusCardClick}
            activeStatus={statusFilter}
          />

          {/* Active filter indicator */}
          {statusFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing: <strong>{statusFilter}</strong> items
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStatusFilter(null)}
              >
                Clear filter
              </Button>
            </div>
          )}

          {/* Views */}
          {currentView === 'list' && (
            <PBCEnhancedList
              items={items}
              entityId={selectedEntity.id}
              isLoading={isLoading}
              onCreateNew={() => setCreateModalOpen(true)}
            />
          )}
          
          {currentView === 'kanban' && (
            <PBCKanbanView
              items={items}
              entityId={selectedEntity.id}
              isLoading={isLoading}
            />
          )}

          {currentView === 'assignee' && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              By Assignee view coming soon...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Modal */}
      <CreatePBCItemModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        entity={selectedEntity}
      />
    </main>
  );
}
