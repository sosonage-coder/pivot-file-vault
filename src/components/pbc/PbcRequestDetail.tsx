import { format } from 'date-fns';
import { 
  Calendar, 
  User, 
  Flag, 
  Clock, 
  FileText,
  CheckCircle2,
  Circle,
  Upload,
  Eye,
  Briefcase,
  GitBranch,
  FileBox
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdatePbcNode } from '@/hooks/usePbcTree';
import type { PbcTreeNode, PbcNodeType } from '@/types/pbc-tree';
import type { PbcStatus } from '@/types/filegrid';
import { PBC_STATUS_COLORS, PBC_NODE_CONFIG } from '@/types/pbc-tree';
import { useState } from 'react';

interface PbcRequestDetailProps {
  node: PbcTreeNode;
  entityId: string;
  onClose?: () => void;
}

const NODE_ICONS: Record<PbcNodeType, React.ElementType> = {
  area: Briefcase,
  dimension: GitBranch,
  object: FileBox,
  request: Circle,
};

const STATUS_ICONS: Record<PbcStatus, React.ElementType> = {
  Requested: Circle,
  Uploaded: Upload,
  Reviewed: Eye,
  Complete: CheckCircle2,
};

export function PbcRequestDetail({ node, entityId, onClose }: PbcRequestDetailProps) {
  const updateNode = useUpdatePbcNode();
  const [notes, setNotes] = useState(node.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const config = PBC_NODE_CONFIG[node.node_type];
  const Icon = NODE_ICONS[node.node_type];
  const isRequest = node.node_type === 'request';

  const handleStatusChange = async (newStatus: PbcStatus) => {
    try {
      await updateNode.mutateAsync({
        id: node.id,
        entityId,
        status: newStatus,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await updateNode.mutateAsync({
        id: node.id,
        entityId,
        priority: newPriority,
      });
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateNode.mutateAsync({
        id: node.id,
        entityId,
        notes,
      });
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Build breadcrumb from ancestors (simplified - would need path in real impl)
  const breadcrumb = node.depth > 0 ? `Depth ${node.depth}` : 'Root';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            'bg-muted'
          )}>
            <Icon className={cn('h-5 w-5', config.colorClass)} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{node.label}</h2>
            <p className="text-sm text-muted-foreground">
              {config.label} • {breadcrumb}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Status (requests only) */}
        {isRequest && node.status && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Status
            </label>
            <Select value={node.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['Requested', 'Uploaded', 'Reviewed', 'Complete'] as PbcStatus[]).map((status) => {
                  const StatusIcon = STATUS_ICONS[status];
                  return (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <span>{status}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Priority (requests only) */}
        {isRequest && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              Priority
            </label>
            <Select value={node.priority || 'normal'} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Due Date (requests only) */}
        {isRequest && node.due_date && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Due Date
            </label>
            <p className="text-sm">
              {format(new Date(node.due_date), 'PPP')}
            </p>
          </div>
        )}

        <Separator />

        {/* Template info */}
        {node.template && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Badge variant="outline">{node.template.name}</Badge>
            {node.template.description && (
              <p className="text-sm text-muted-foreground">{node.template.description}</p>
            )}
          </div>
        )}

        {/* Area/Object anchors */}
        {node.areaName && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Linked Area</label>
            <p className="text-sm">{node.areaName}</p>
          </div>
        )}
        {node.objectName && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Linked Object</label>
            <p className="text-sm">{node.objectName}</p>
          </div>
        )}

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes or context..."
            className="min-h-[100px] resize-none"
          />
          {notes !== (node.notes || '') && (
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
            >
              {isSavingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          )}
        </div>

        {/* Completion info for non-requests */}
        {!isRequest && node.completion.total > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Completion</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${node.completion.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {node.completion.complete}/{node.completion.total}
              </span>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Created: {format(new Date(node.created_at), 'PPP')}</p>
          <p>Updated: {format(new Date(node.updated_at), 'PPP')}</p>
        </div>
      </div>
    </div>
  );
}
