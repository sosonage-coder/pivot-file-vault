import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarClock,
  Scale,
  FileText,
  ClipboardList,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Search,
  Shield,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useModule } from '@/contexts/ModuleContext';
import { useSidebarSelection } from '@/contexts/SidebarSelectionContext';
import { useEntities } from '@/hooks/useEntities';
import { useFeatureFolderStructure } from '@/hooks/useFeatureFolderStructure';
import { usePendingApprovalCounts } from '@/hooks/useApprovals';
import { useReconciliations } from '@/hooks/useReconciliations';
import { useReconciliationTree } from '@/hooks/useReconciliationTree';
import { UnifiedFolderTree } from '@/components/filegrid/UnifiedFolderTree';
import { ReconciliationTree } from '@/components/reconciliations/ReconciliationTree';
import { SimpleAddProcessModal } from '@/components/filegrid/SimpleAddProcessModal';
import type { FeatureId } from '@/hooks/useActiveFeature';
import type { TreeNode } from '@/types/filegrid';
import type { ReconciliationTreeNode } from '@/hooks/useReconciliationTree';

const FEATURES = [
  {
    id: 'monthclose' as FeatureId,
    label: 'Close',
    icon: CalendarClock,
    path: '/close',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    id: 'reconciliations' as FeatureId,
    label: 'Recons',
    icon: Scale,
    path: '/reconciliations',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    id: 'documents' as FeatureId,
    label: 'Docs',
    icon: FileText,
    path: '/documents',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'pbc' as FeatureId,
    label: 'PBC',
    icon: ClipboardList,
    path: '/pbc',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'compliance' as FeatureId,
    label: 'Comply',
    icon: Shield,
    path: '/compliance',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'checklists' as FeatureId,
    label: 'Lists',
    icon: CheckSquare,
    path: '/checklists',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'meetings' as FeatureId,
    label: 'Meet',
    icon: Users,
    path: '/meetings',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    disabled: true,
  },
];

interface UnifiedSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function UnifiedSidebar({ collapsed = false, onCollapsedChange }: UnifiedSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { selectedEntity, setSelectedEntity, selectedPeriod } = useModule();
  const { selectedNode, setSelectedNode } = useSidebarSelection();
  const { data: entities = [] } = useEntities();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateProcess, setShowCreateProcess] = useState(false);

  // Auto-select first entity
  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity, setSelectedEntity]);

  const activeFeature = FEATURES.find(f => location.pathname.startsWith(f.path))?.id || 'monthclose';
  
  // Show folder tree for all features that use structural navigation
  const showFolderTree = ['documents', 'pbc', 'monthclose', 'compliance', 'checklists'].includes(activeFeature);
  const showReconciliationTree = activeFeature === 'reconciliations';
  const featureType = activeFeature === 'pbc' ? 'pbc' : activeFeature === 'monthclose' ? 'monthclose' : 'documents';

  // Fetch folder tree data
  const { data: folderTree = [], isLoading: isLoadingTree } = useFeatureFolderStructure({
    entityId: selectedEntity?.id || null,
    periodId: selectedPeriod?.id || null,
    featureType: featureType,
  });

  // Fetch reconciliation data (for reconciliations tree)
  const { data: reconciliations = [], isLoading: isLoadingReconciliations } = useReconciliations(
    showReconciliationTree ? selectedEntity?.id || null : null,
    selectedPeriod?.id
  );
  const reconciliationTree = useReconciliationTree(reconciliations);

  // Get pending approval counts
  const { data: pendingCounts = {} } = usePendingApprovalCounts(selectedEntity?.id || null);

  // Filter nodes by search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return folderTree;
    
    const lowerQuery = searchQuery.toLowerCase();
    
    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce<TreeNode[]>((acc, node) => {
        const matchesQuery = node.name.toLowerCase().includes(lowerQuery);
        const filteredChildren = node.children ? filterNodes(node.children) : undefined;
        
        if (matchesQuery || (filteredChildren && filteredChildren.length > 0)) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }
        
        return acc;
      }, []);
    };
    
    return filterNodes(folderTree);
  }, [folderTree, searchQuery]);

  const handleFeatureClick = (feature: typeof FEATURES[0]) => {
    if (!feature.disabled) {
      navigate(feature.path);
      // Clear selection when switching features
      setSelectedNode(null);
      setSearchQuery('');
    }
  };

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
  };

  // Handle reconciliation tree selection - convert to TreeNode format
  const handleReconciliationNodeSelect = (node: ReconciliationTreeNode) => {
    if (node.type === 'account' && node.reconciliationId) {
      // Convert to TreeNode format for compatibility with useSidebarSelection
      const treeNode: TreeNode = {
        id: node.reconciliationId,
        name: node.name,
        type: 'object', // Use 'object' type for reconciliation accounts
        metadata: {
          ...node.metadata,
          reconciliationId: node.reconciliationId,
        },
      };
      setSelectedNode(treeNode);
    }
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-sidebar-background transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header with Logo and Entity Selector */}
      <div className={cn(
        'flex h-12 items-center border-b px-3 gap-2',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary flex-shrink-0">
          <span className="text-xs font-bold text-primary-foreground">F</span>
        </div>
        {!collapsed && (
          <>
            <span className="font-semibold text-sm">FileGRID</span>
            <div className="flex-1" />
            {/* Compact Entity Selector in header */}
            <Select
              value={selectedEntity?.id || ''}
              onValueChange={(value) => {
                const entity = entities.find(e => e.id === value);
                if (entity) setSelectedEntity(entity);
              }}
            >
              <SelectTrigger className="h-7 w-24 text-xs border-0 bg-muted/50 px-2">
                <Building2 className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id} className="text-xs">
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Collapsed Context Indicators */}
      {collapsed && (
        <div className="flex flex-col items-center gap-2 border-b py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {selectedEntity?.name || 'No entity selected'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Feature Navigation Tabs - More Compact */}
      <div className={cn('border-b p-1.5', collapsed && 'px-1')}>
        <div className={cn('grid gap-0.5', collapsed ? 'grid-cols-1' : 'grid-cols-4')}>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;

            const tabButton = (
              <Tooltip key={feature.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleFeatureClick(feature)}
                    disabled={feature.disabled}
                    className={cn(
                      'flex items-center justify-center rounded-md p-1.5 transition-all',
                      'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive && 'bg-accent ring-1 ring-primary/20',
                      feature.disabled && 'cursor-not-allowed opacity-50',
                      !collapsed && 'flex-col gap-0.5'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded transition-colors',
                        isActive ? feature.bgColor : ''
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-3.5 w-3.5 transition-colors',
                          isActive ? feature.color : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    {!collapsed && (
                      <span className={cn(
                        'text-[9px] font-medium leading-none',
                        !isActive && 'text-muted-foreground'
                      )}>
                        {feature.label}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? 'right' : 'bottom'} className="text-xs">
                  {feature.label}
                  {feature.disabled && ' (Coming soon)'}
                </TooltipContent>
              </Tooltip>
            );

            return tabButton;
          })}
        </div>
      </div>

      {/* Context-Aware Content Panel - Show for all structural features */}
      {!collapsed && showFolderTree && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Compact Search + Add Process Row */}
          <div className="p-1.5 border-b flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 text-xs"
              />
            </div>
            {selectedEntity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreateProcess(true)}
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Add Process</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Folder Tree */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoadingTree ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <UnifiedFolderTree
                  nodes={filteredNodes}
                  selectedId={selectedNode?.id || null}
                  onSelect={handleNodeSelect}
                  pendingCounts={pendingCounts}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Reconciliation Tree Panel */}
      {!collapsed && showReconciliationTree && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Compact Search + Add Process Row */}
          <div className="p-1.5 border-b flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 text-xs"
              />
            </div>
            {selectedEntity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreateProcess(true)}
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Add Process</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Reconciliation Tree */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoadingReconciliations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <ReconciliationTree
                  nodes={reconciliationTree}
                  selectedId={(selectedNode?.metadata?.reconciliationId as string | undefined) || selectedNode?.id || null}
                  onSelect={handleReconciliationNodeSelect}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {!collapsed && !showFolderTree && !showReconciliationTree && (
        <ScrollArea className="flex-1">
          <div className="p-4 text-center text-sm text-muted-foreground">
            {activeFeature === 'meetings' && 'Meetings (coming soon)'}
          </div>
        </ScrollArea>
      )}

      {/* Collapsed scroll area */}
      {collapsed && <div className="flex-1" />}

      {/* Footer */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full justify-start gap-2', collapsed && 'justify-center px-2')}
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-muted-foreground">Collapse</span>
            </>
          )}
        </Button>

        <Separator className="my-2" />

        <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn('flex-1 justify-start gap-2', collapsed && 'w-full justify-center px-2')}
              >
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Settings</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className={cn(collapsed && 'w-full justify-center px-2')}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="sr-only">Sign out</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Sign out{user?.email && ` (${user.email})`}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Simple Create Process Modal */}
      {selectedEntity && (
        <SimpleAddProcessModal
          open={showCreateProcess}
          onOpenChange={setShowCreateProcess}
          entityId={selectedEntity.id}
        />
      )}
    </aside>
  );
}
