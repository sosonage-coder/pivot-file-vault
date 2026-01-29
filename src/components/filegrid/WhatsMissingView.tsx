import { useState } from 'react';
import { Check, Circle, AlertTriangle, Download, Loader2, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePeriods } from '@/hooks/usePeriods';
import { useExpectedDocuments, exportExpectedDocumentsCSV } from '@/hooks/useExpectedDocuments';
import type { Entity } from '@/types/filegrid';

interface WhatsMissingViewProps {
  entity: Entity;
}

export function WhatsMissingView({ entity }: WhatsMissingViewProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  
  const { data: periods = [], isLoading: periodsLoading } = usePeriods();
  const { data: expectedDocs = [], isLoading: docsLoading } = useExpectedDocuments({
    entityId: entity.id,
    periodId: selectedPeriodId || null
  });

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  // Group by Department → Process → Area
  const grouped = expectedDocs.reduce((acc, doc) => {
    const deptKey = doc.departmentName;
    const procKey = `${deptKey}|${doc.processName}`;
    const areaKey = `${procKey}|${doc.areaName}`;

    if (!acc.departments[deptKey]) {
      acc.departments[deptKey] = { name: deptKey, processes: {} };
    }
    if (!acc.departments[deptKey].processes[procKey]) {
      acc.departments[deptKey].processes[procKey] = { name: doc.processName, areas: {} };
    }
    if (!acc.departments[deptKey].processes[procKey].areas[areaKey]) {
      acc.departments[deptKey].processes[procKey].areas[areaKey] = { name: doc.areaName, items: [] };
    }
    acc.departments[deptKey].processes[procKey].areas[areaKey].items.push(doc);
    
    return acc;
  }, { departments: {} } as any);

  // Stats
  const totalExpected = expectedDocs.length;
  const totalUploaded = expectedDocs.filter(d => d.uploaded).length;
  const totalMissing = totalExpected - totalUploaded;
  const requiredMissing = expectedDocs.filter(d => d.required && !d.uploaded).length;

  const handleExport = () => {
    if (selectedPeriod && expectedDocs.length > 0) {
      exportExpectedDocumentsCSV(expectedDocs, selectedPeriod.label);
    }
  };

  if (periodsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">What's Missing</h3>
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select period..." />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {expectedDocs.length > 0 && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span>Uploaded</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-muted-foreground" />
          <span>Missing</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Required & Missing</span>
        </div>
      </div>

      {!selectedPeriodId ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            Select a period to see document gaps
          </p>
        </div>
      ) : docsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : expectedDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            No expected documents configured for this entity
          </p>
          <p className="text-sm text-muted-foreground">
            Configure area templates with required document types
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Expected</p>
              <p className="text-2xl font-semibold">{totalExpected}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Uploaded</p>
              <p className="text-2xl font-semibold text-green-600">{totalUploaded}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Missing</p>
              <p className="text-2xl font-semibold text-muted-foreground">{totalMissing}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Required Missing</p>
              <p className={cn("text-2xl font-semibold", requiredMissing > 0 ? "text-amber-500" : "text-green-600")}>
                {requiredMissing}
              </p>
            </div>
          </div>

          {/* Grouped List */}
          <div className="space-y-4">
            {Object.values(grouped.departments).map((dept: any) => (
              <div key={dept.name} className="rounded-lg border">
                <div className="border-b bg-muted/50 px-4 py-2">
                  <h4 className="font-medium">{dept.name}</h4>
                </div>
                <div className="divide-y">
                  {Object.values(dept.processes).map((proc: any) => (
                    <div key={proc.name} className="px-4 py-3">
                      <h5 className="mb-2 text-sm font-medium text-muted-foreground">
                        {proc.name}
                      </h5>
                      <div className="space-y-3">
                        {Object.values(proc.areas).map((area: any) => (
                          <div key={area.name} className="ml-4">
                            <p className="mb-1 text-sm font-medium">{area.name}</p>
                            <div className="ml-4 space-y-1">
                              {area.items.map((item: any) => (
                                <div
                                  key={`${item.areaId}-${item.documentTypeId}`}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {item.uploaded ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : item.required ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className={cn(item.uploaded && "text-muted-foreground")}>
                                    {item.documentTypeName}
                                  </span>
                                  {item.required && (
                                    <Badge variant="outline" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
