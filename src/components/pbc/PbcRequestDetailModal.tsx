import { useState, useRef } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  Circle,
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePbcAttachments, useUploadPbcAttachment, useDeletePbcAttachment } from '@/hooks/usePbcAttachments';
import { usePbcComments, useAddPbcComment } from '@/hooks/usePbcComments';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import type { PbcStatus } from '@/types/filegrid';

interface PbcRequest {
  id: string;
  label: string;
  status: PbcStatus | null;
  assignee_id: string | null;
  due_date: string | null;
  notes: string | null;
  priority?: string | null;
}

interface PbcRequestDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PbcRequest;
  entityId: string;
  objectName: string;
}

const STATUS_CONFIG: Record<PbcStatus, { icon: React.ElementType; color: string; label: string }> = {
  Requested: { icon: Circle, color: 'text-muted-foreground', label: 'Requested' },
  Uploaded: { icon: Upload, color: 'text-blue-500', label: 'Uploaded' },
  Reviewed: { icon: Eye, color: 'text-amber-500', label: 'Reviewed' },
  Complete: { icon: CheckCircle2, color: 'text-green-500', label: 'Complete' },
};

export function PbcRequestDetailModal({
  open,
  onOpenChange,
  request,
  entityId,
  objectName,
}: PbcRequestDetailModalProps) {
  const { isExternalReviewer } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newComment, setNewComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Hooks
  const { data: attachments = [], isLoading: attachmentsLoading } = usePbcAttachments(request.id);
  const { data: comments = [], isLoading: commentsLoading } = usePbcComments(request.id);
  const uploadAttachment = useUploadPbcAttachment();
  const deleteAttachment = useDeletePbcAttachment();
  const addComment = useAddPbcComment();

  const currentStatus = request.status || 'Requested';
  const StatusIcon = STATUS_CONFIG[currentStatus].icon;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      try {
        await uploadAttachment.mutateAsync({
          nodeId: request.id,
          entityId,
          file,
        });
        toast({ title: `Uploaded ${file.name}` });
      } catch (error) {
        toast({ title: `Failed to upload ${file.name}`, variant: 'destructive' });
      }
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = async (attachmentId: string, filePath: string) => {
    try {
      await deleteAttachment.mutateAsync({
        id: attachmentId,
        filePath,
        nodeId: request.id,
      });
      toast({ title: 'File deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete file', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (newStatus: PbcStatus) => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('pbc_nodes')
        .update({ status: newStatus })
        .eq('id', request.id);

      if (error) throw error;
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['pbc-object-requests'] });
      toast({ title: `Status updated to ${newStatus}` });
    } catch (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment.mutateAsync({
        nodeId: request.id,
        content: newComment.trim(),
      });
      setNewComment('');
      toast({ title: 'Comment added' });
    } catch (error) {
      toast({ title: 'Failed to add comment', variant: 'destructive' });
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('pbc-files').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{request.label}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{objectName}</p>
            </div>
            <Badge 
              variant="outline" 
              className={cn('gap-1', STATUS_CONFIG[currentStatus].color)}
            >
              <StatusIcon className="h-3 w-3" />
              {STATUS_CONFIG[currentStatus].label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {/* Status Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Status
              </label>
              <Select 
                value={currentStatus} 
                onValueChange={(v) => handleStatusChange(v as PbcStatus)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Requested', 'Uploaded', 'Reviewed', 'Complete'] as PbcStatus[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', config.color)} />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm">
              {request.due_date && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Due: {format(new Date(request.due_date), 'MMM d, yyyy')}
                </div>
              )}
              {request.priority && (
                <Badge variant="secondary" className="text-xs">
                  {request.priority} priority
                </Badge>
              )}
            </div>

            {request.notes && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">{request.notes}</p>
              </div>
            )}

            <Separator />

            {/* File Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Attachments ({attachments.length})
                </label>
                {!isExternalReviewer && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx,.csv"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadAttachment.isPending}
                    >
                      {uploadAttachment.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload File
                    </Button>
                  </>
                )}
              </div>

              {attachmentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                  <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a href={getFileUrl(attachment.file_path)} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        {!isExternalReviewer && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteFile(attachment.id, attachment.file_path)}
                            disabled={deleteAttachment.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Comments Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Comments ({comments.length})
              </label>

              {commentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No comments yet
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addComment.isPending}
                className="w-full"
              >
                {addComment.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Post Comment
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
