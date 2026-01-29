import { useState } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  Clock, 
  User, 
  CalendarDays,
  Plus,
  Loader2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { PbcStatus } from '@/types/filegrid';
import type { TreeNode } from '@/types/filegrid';

interface PbcRequest {
  id: string;
  label: string;
  status: PbcStatus | null;
  assignee_id: string | null;
  due_date: string | null;
  notes: string | null;
}

interface PbcChecklistWorkspaceProps {
  objectNode: TreeNode;
  requests: PbcRequest[];
  isLoading: boolean;
  onFulfillRequest: (requestId: string, fileUrl: string) => Promise<void>;
  onAddRequest: () => void;
}

export function PbcChecklistWorkspace({ 
  objectNode, 
  requests, 
  isLoading,
  onFulfillRequest,
  onAddRequest
}: PbcChecklistWorkspaceProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');

  const handleFulfill = async (requestId: string) => {
    if (!fileUrl.trim()) {
      toast({ title: 'Please enter a file URL', variant: 'destructive' });
      return;
    }
    
    setUploadingId(requestId);
    try {
      await onFulfillRequest(requestId, fileUrl);
      setFileUrl('');
      toast({ title: 'Request fulfilled!' });
    } catch (error) {
      toast({ title: 'Failed to fulfill request', variant: 'destructive' });
    } finally {
      setUploadingId(null);
    }
  };

  const completedCount = requests.filter(r => r.status === 'Complete').length;
  const totalCount = requests.length;

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
            PBC Requests • {completedCount} of {totalCount} completed
          </p>
        </div>
        <Button onClick={onAddRequest}>
          <Plus className="mr-2 h-4 w-4" />
          Add Request
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted">
        <div 
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
        />
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
        <div className="space-y-3">
          {requests.map((request, index) => {
            const isComplete = request.status === 'Complete';
            const isUploading = uploadingId === request.id;
            
            return (
              <Card 
                key={request.id} 
                className={cn(
                  "transition-colors",
                  isComplete && "bg-muted/50 border-muted"
                )}
              >
                <CardContent className="flex items-start gap-4 py-4">
                  {/* Checkbox */}
                  <div className="pt-1">
                    <Checkbox 
                      checked={isComplete}
                      disabled
                      className={cn(
                        isComplete && "bg-primary border-primary"
                      )}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium",
                          isComplete && "line-through text-muted-foreground"
                        )}>
                          {index + 1}. {request.label}
                        </p>
                        
                        {request.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.notes}
                          </p>
                        )}
                        
                        {/* Meta info */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {request.due_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              Due: {new Date(request.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {request.assignee_id && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Assigned
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status badge */}
                      <Badge 
                        variant={isComplete ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {isComplete ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Complete
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    {/* Upload action for pending requests */}
                    {!isComplete && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Input
                          placeholder="Enter file URL or upload link..."
                          value={uploadingId === request.id ? fileUrl : ''}
                          onChange={(e) => {
                            setUploadingId(request.id);
                            setFileUrl(e.target.value);
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleFulfill(request.id)}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Fulfill
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
