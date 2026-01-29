import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { GroupedDocuments } from '@/hooks/usePivotDocuments';
import type { DocumentWithRelations } from '@/types/filegrid';

interface PivotViewProps {
  groups: GroupedDocuments[];
  isLoading?: boolean;
}

interface DocumentRowProps {
  document: DocumentWithRelations;
}

function DocumentRow({ document }: DocumentRowProps) {
  const statusColors: Record<string, string> = {
    Draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Final: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Superseded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    Archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const displayName = [
    document.objects?.name,
    document.document_types?.name,
    document.periods?.label,
    document.status,
  ]
    .filter(Boolean)
    .join('_');

  return (
    <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">{displayName}</p>
          {document.notes && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {document.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className={cn('text-xs', statusColors[document.status])}>
          {document.status}
        </Badge>
        {document.version > 1 && (
          <Badge variant="outline" className="text-xs">
            v{document.version}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.open(document.external_file_url, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface GroupSectionProps {
  group: GroupedDocuments;
  level?: number;
}

function GroupSection({ group, level = 0 }: GroupSectionProps) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const hasSubgroups = group.subgroups && group.subgroups.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-medium transition-colors hover:bg-muted',
            level === 0 ? 'text-base' : 'text-sm'
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="flex-1">{group.label}</span>
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {group.documents.length}
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div
          className="space-y-1 pb-2"
          style={{ paddingLeft: `${level * 16 + 28}px` }}
        >
          {hasSubgroups ? (
            group.subgroups!.map((subgroup) => (
              <GroupSection
                key={subgroup.key}
                group={subgroup}
                level={level + 1}
              />
            ))
          ) : (
            <div className="space-y-1 pt-1">
              {group.documents.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PivotView({ groups, isLoading }: PivotViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No documents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <GroupSection key={group.key} group={group} />
      ))}
    </div>
  );
}
