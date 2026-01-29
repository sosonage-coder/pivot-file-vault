import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Upload, 
  CheckCircle2, 
  Clock, 
  User, 
  CalendarDays,
  Plus,
  Loader2,
  FileText,
  Circle,
  Eye,
  ChevronRight,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PbcRequestDetailModal } from './PbcRequestDetailModal';
import type { PbcStatus } from '@/types/filegrid';
import type { TreeNode } from '@/types/filegrid';

interface PbcRequest {
  id: string;
  label: string;
  status: PbcStatus | null;
  assignee_id: string | null;
  due_date: string | null;
  notes: string | null;
  priority?: string | null;
}

interface PbcChecklistWorkspaceProps {
  objectNode: TreeNode;
  requests: PbcRequest[];
  isLoading: boolean;
  onFulfillRequest: (requestId: string, fileUrl: string) => Promise<void>;
  onAddRequest: () => void;
  entityId: string;
}

const STATUS_CONFIG: Record<PbcStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
  Requested: { icon: Circle, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  Uploaded: { icon: Upload, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  Reviewed: { icon: Eye, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  Complete: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
};

export function PbcChecklistWorkspace({ 
  objectNode, 
  requests, 
  isLoading,
  onFulfillRequest,
  onAddRequest,
  entityId
}: PbcChecklistWorkspaceProps) {
  const [selectedRequest, setSelectedRequest] = useState<PbcRequest | null>(null);

  const completedCount = requests.filter(r => r.status === 'Complete').length;
  const totalCount = requests.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{objectNode.name}</h2>
          <p className="text-muted-foreground">
            PBC Requests • {completedCount} of {totalCount} complete
          </p>
        </div>
        <Button onClick={onAddRequest}>
          <Plus className="mr-2 h-4 w-4" />
          Add Request
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedCount} completed</span>
          <span>{totalCount - completedCount} remaining</span>
        </div>
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No requests for this item yet</p>
            <Button variant="outline" onClick={onAddRequest}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {requests.map((request, index) => {
            const status = request.status || 'Requested';
            const config = STATUS_CONFIG[status];
            const StatusIcon = config.icon;
            const isComplete = status === 'Complete';
            
            return (
              <Card 
                key={request.id} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                  isComplete && "bg-muted/30"
                )}
                onClick={() => setSelectedRequest(request)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Status icon */}
                  <div className={cn(
                    'p-2 rounded-full shrink-0',
                    config.bgColor
                  )}>
                    <StatusIcon className={cn('h-4 w-4', config.color)} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium",
                          isComplete && "text-muted-foreground"
                        )}>
                          {index + 1}. {request.label}
                        </p>
                        
                        {/* Meta info */}
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {request.due_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(request.due_date), 'MMM d')}
                            </span>
                          )}
                          {request.priority && request.priority !== 'normal' && (
                            <Badge variant="outline" className="text-xs h-5">
                              {request.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Status badge and arrow */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge 
                          variant={isComplete ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <PbcRequestDetailModal
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          request={selectedRequest}
          entityId={entityId}
          objectName={objectNode.name}
        />
      )}
    </div>
  );
}
