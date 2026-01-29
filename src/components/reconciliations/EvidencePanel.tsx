import { useMemo } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCheck, 
  Plus, 
  ExternalLink,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  useReconciliationAttachments, 
  useRemoveReconciliationAttachment 
} from '@/hooks/useReconciliations';
import type { ReconciliationAttachmentWithDocument } from '@/types/reconciliations';

interface EvidencePanelProps {
  reconciliationId: string;
  isEditable: boolean;
  onAddDocument?: (attachmentType: AttachmentCategory) => void;
}

type AttachmentCategory = 'evidence' | 'workpaper' | 'report';

interface CategoryConfig {
  label: string;
  icon: typeof FileText;
  description: string;
  color: string;
}

const categoryConfig: Record<AttachmentCategory, CategoryConfig> = {
  evidence: {
    label: 'Evidence',
    icon: FileText,
    description: 'Bank statements, invoices, confirmations',
    color: 'text-blue-600 dark:text-blue-400',
  },
  workpaper: {
    label: 'Workpapers',
    icon: FileSpreadsheet,
    description: 'Excel schedules, calculations, analysis',
    color: 'text-amber-600 dark:text-amber-400',
  },
  report: {
    label: 'Reports',
    icon: FileCheck,
    description: 'Final reconciliation reports (auto-generated)',
    color: 'text-green-600 dark:text-green-400',
  },
};

export function EvidencePanel({ 
  reconciliationId, 
  isEditable,
  onAddDocument 
}: EvidencePanelProps) {
  const { data: attachments = [] } = useReconciliationAttachments(reconciliationId);
  const removeAttachment = useRemoveReconciliationAttachment();

  // Group attachments by category
  const groupedAttachments = useMemo(() => {
    const groups: Record<AttachmentCategory, ReconciliationAttachmentWithDocument[]> = {
      evidence: [],
      workpaper: [],
      report: [],
    };

    attachments.forEach((attachment) => {
      const type = (attachment.attachment_type || 'evidence') as AttachmentCategory;
      if (type in groups) {
        groups[type].push(attachment);
      } else {
        groups.evidence.push(attachment);
      }
    });

    return groups;
  }, [attachments]);

  const handleRemove = (attachmentId: string) => {
    removeAttachment.mutate({ 
      id: attachmentId, 
      reconciliationId 
    });
  };

  const totalCount = attachments.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Supporting Evidence</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Documents attached to this reconciliation
            </p>
          </div>
          <Badge variant="secondary">{totalCount} files</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(categoryConfig) as AttachmentCategory[]).map((category) => {
          const config = categoryConfig[category];
          const items = groupedAttachments[category];
          const Icon = config.icon;
          const isReport = category === 'report';

          return (
            <Collapsible key={category} defaultOpen={items.length > 0}>
              <div className="rounded-lg border">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-5 w-5', config.color)} />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {items.length}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  {!isReport && isEditable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddDocument?.(category);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {isReport 
                            ? 'Reports will appear here when generated'
                            : `No ${config.label.toLowerCase()} attached`
                          }
                        </p>
                        {!isReport && isEditable && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => onAddDocument?.(category)}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add {config.label}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {items.map((attachment) => (
                          <AttachmentRow
                            key={attachment.id}
                            attachment={attachment}
                            isEditable={isEditable && !isReport}
                            onRemove={() => handleRemove(attachment.id)}
                            isPending={removeAttachment.isPending}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface AttachmentRowProps {
  attachment: ReconciliationAttachmentWithDocument;
  isEditable: boolean;
  onRemove: () => void;
  isPending: boolean;
}

function AttachmentRow({ 
  attachment, 
  isEditable, 
  onRemove,
  isPending 
}: AttachmentRowProps) {
  const fileName = attachment.documents?.logical_name || 'Unknown file';
  const fileUrl = attachment.documents?.external_file_url;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{fileName}</p>
          {attachment.notes && (
            <p className="text-xs text-muted-foreground truncate">
              {attachment.notes}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        {fileUrl && (
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Open file"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        {isEditable && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            disabled={isPending}
            title="Remove attachment"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
