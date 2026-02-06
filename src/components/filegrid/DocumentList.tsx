import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ApprovalActions } from './ApprovalActions';
import type { AuditDocumentStatus, DocumentWithRelations, DocumentStatus, DocumentWorkflowStage } from '@/types/filegrid';
import { ExternalLink, FileText } from 'lucide-react';
import type {
  AuditDocumentStatus,
  DocumentWithRelations,
  DocumentStatus,
  DocumentWorkflowStage,
} from '@/types/filegrid';
import { formatDistanceToNow } from 'date-fns';
import { useDocumentApproval } from '@/hooks/useApprovals';
import { useUpdateDocumentAudit } from '@/hooks/useDocumentAudit';

interface DocumentListProps {
  documents: DocumentWithRelations[];
  isLoading?: boolean;
  auditMode?: boolean;
}

const statusColors: Record<DocumentStatus, string> = {
  Draft: 'bg-[hsl(var(--status-draft))] text-[hsl(var(--status-draft-foreground))]',
  Final: 'bg-[hsl(var(--status-final))] text-[hsl(var(--status-final-foreground))]',
  Superseded: 'bg-[hsl(var(--status-superseded))] text-[hsl(var(--status-superseded-foreground))]',
  Archived: 'bg-[hsl(var(--status-archived))] text-[hsl(var(--status-archived-foreground))]',
};

function getRenderedFilename(doc: DocumentWithRelations): string {
  const objectName = doc.objects?.name || 'Unknown';
  const docType = doc.document_types?.name || 'Document';
  const period = doc.periods?.label || '';
  const status = doc.status;

  return `${objectName}_${docType}_${period}_${status}`;
}

function getWorkflowStage(doc: DocumentWithRelations, approvalStatus?: string): DocumentWorkflowStage {
  if (doc.status === 'Final') return 'Final';
  if (approvalStatus === 'approved') return 'Reviewed';
  if (approvalStatus === 'pending') return 'Ready for Review';
  return 'Draft';
}

export function DocumentList({ documents, isLoading, auditMode = false }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium">No documents</h3>
        <p className="mt-1 text-sm text-muted-foreground">Select an area to view documents or upload a new file</p>
      </div>
    );
  }

  const handleRowOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Name</TableHead>
            <TableHead>Object</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Approval</TableHead>
            <TableHead>Type</TableHead>
            {auditMode && <TableHead>PBC-Ready</TableHead>}
            {auditMode && <TableHead>Audit</TableHead>}
            <TableHead className="text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onOpen={handleRowClick} auditMode={auditMode} />
            <DocumentRow key={doc.id} doc={doc} onOpen={handleRowOpen} auditMode={auditMode} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getWorkflowStage(doc: DocumentWithRelations, approvalStatus?: string): DocumentWorkflowStage {
  if (doc.status === 'Final') return 'Final';
  if (approvalStatus === 'approved') return 'Reviewed';
  if (approvalStatus === 'pending') return 'Ready for Review';
  return 'Draft';
}

function DocumentRow({ doc, onOpen, auditMode }: { doc: DocumentWithRelations; onOpen: (url: string) => void; auditMode: boolean }) {
  const { data: approval } = useDocumentApproval(doc.id);
  const updateDocumentAudit = useUpdateDocumentAudit();
function DocumentRow({
  doc,
  onOpen,
  auditMode,
}: {
  doc: DocumentWithRelations;
  onOpen: (url: string) => void;
  auditMode: boolean;
}) {
  const { data: approval } = useDocumentApproval(doc.id);
  const updateDocumentAudit = useUpdateDocumentAudit();

  const workflowStage = getWorkflowStage(doc, approval?.status);

  const handleAuditStatusChange = (status: AuditDocumentStatus) => {
    updateDocumentAudit.mutate({
      documentId: doc.id,
      auditStatus: status,
    });
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onDoubleClick={() => onOpen(doc.external_file_url)}
    >
    <TableRow className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => onOpen(doc.external_file_url)}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{getRenderedFilename(doc)}</span>
          {doc.version > 1 && (
            <span className="text-xs text-muted-foreground">v{doc.version}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{doc.objects?.name || '—'}</TableCell>
      <TableCell className="text-muted-foreground">{doc.periods?.label || '—'}</TableCell>
          {doc.version > 1 && <span className="text-xs text-muted-foreground">v{doc.version}</span>}
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground">{doc.objects?.name || '—'}</TableCell>
      <TableCell className="text-muted-foreground">{doc.periods?.label || '—'}</TableCell>

      <TableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className={cn('text-xs', statusColors[doc.status])}>
            {doc.status}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {workflowStage}
          </Badge>
        </div>
      </TableCell>

      <TableCell>
        <ApprovalActions
          documentId={doc.id}
          objectRequiresApproval={doc.objects?.requires_approval}
          documentStatus={doc.status}
        />
      </TableCell>
      <TableCell className="text-muted-foreground">{doc.document_types?.name || '—'}</TableCell>

      <TableCell className="text-muted-foreground">{doc.document_types?.name || '—'}</TableCell>

      {auditMode && (
        <TableCell>
          <Checkbox
            checked={doc.pbc_ready}
            onCheckedChange={(checked) => updateDocumentAudit.mutate({ documentId: doc.id, pbcReady: checked === true })}
          />
        </TableCell>
      )}
            onCheckedChange={(checked) =>
              updateDocumentAudit.mutate({ documentId: doc.id, pbcReady: checked === true })
            }
          />
        </TableCell>
      )}

      {auditMode && (
        <TableCell>
          <Select
            value={doc.audit_status || 'Requested'}
            onValueChange={(value) => handleAuditStatusChange(value as AuditDocumentStatus)}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Requested">Requested</SelectItem>
              <SelectItem value="Provided">Provided</SelectItem>
              <SelectItem value="Complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
      )}
      <TableCell className="text-right text-muted-foreground">
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm">{formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</span>

      <TableCell className="text-right text-muted-foreground">
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm">
            {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
          </span>
          <ExternalLink className="h-3.5 w-3.5 opacity-50" />
        </div>
      </TableCell>
    </TableRow>
  );
}
