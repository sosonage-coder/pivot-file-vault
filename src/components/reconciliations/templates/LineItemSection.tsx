import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReconciliationLineItem, ReconciliationLineType } from '@/types/reconciliations';
import { useCreateLineItem, useUpdateLineItem, useDeleteLineItem } from '@/hooks/useReconciliationLineItems';
import { cn } from '@/lib/utils';

interface LineItemSectionProps {
  title: string;
  lineType: ReconciliationLineType;
  reconciliationId: string;
  items: ReconciliationLineItem[];
  isEditable: boolean;
  onItemsChange: () => void;
  showDates?: boolean;
  showQuantityRate?: boolean;
}

export function LineItemSection({
  title,
  lineType,
  reconciliationId,
  items,
  isEditable,
  onItemsChange,
  showDates = false,
  showQuantityRate = false,
}: LineItemSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ReconciliationLineItem>>({});
  
  const createLineItem = useCreateLineItem();
  const updateLineItem = useUpdateLineItem();
  const deleteLineItem = useDeleteLineItem();
  
  const sectionItems = items.filter(item => item.line_type === lineType);
  const total = sectionItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  const handleAdd = async () => {
    await createLineItem.mutateAsync({
      reconciliation_id: reconciliationId,
      line_type: lineType,
      description: '',
      amount: 0,
      sort_order: sectionItems.length,
    });
    onItemsChange();
  };
  
  const handleDelete = async (id: string) => {
    await deleteLineItem.mutateAsync({ id, reconciliationId });
    onItemsChange();
  };
  
  const startEditing = (item: ReconciliationLineItem) => {
    setEditingId(item.id);
    setEditValues({
      description: item.description || '',
      amount: item.amount,
      quantity: item.quantity,
      rate: item.rate,
      start_date: item.start_date,
      end_date: item.end_date,
    });
  };
  
  const saveEdit = async () => {
    if (!editingId) return;
    
    await updateLineItem.mutateAsync({
      id: editingId,
      reconciliationId,
      updates: editValues,
    });
    setEditingId(null);
    setEditValues({});
    onItemsChange();
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {isEditable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            disabled={createLineItem.isPending}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        )}
      </div>
      
      {sectionItems.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {isEditable && <TableHead className="w-8" />}
                <TableHead>Description</TableHead>
                {showQuantityRate && (
                  <>
                    <TableHead className="w-24 text-right">Qty</TableHead>
                    <TableHead className="w-24 text-right">Rate</TableHead>
                  </>
                )}
                {showDates && (
                  <>
                    <TableHead className="w-28">Start</TableHead>
                    <TableHead className="w-28">End</TableHead>
                  </>
                )}
                <TableHead className="w-32 text-right">Amount</TableHead>
                {isEditable && <TableHead className="w-16" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectionItems.map((item) => (
                <TableRow key={item.id}>
                  {isEditable && (
                    <TableCell className="w-8">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                  )}
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        value={editValues.description || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <span
                        className={cn(
                          "cursor-pointer",
                          isEditable && "hover:text-primary"
                        )}
                        onClick={() => isEditable && startEditing(item)}
                      >
                        {item.description || <span className="text-muted-foreground italic">No description</span>}
                      </span>
                    )}
                  </TableCell>
                  {showQuantityRate && (
                    <>
                      <TableCell className="text-right">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editValues.quantity ?? ''}
                            onChange={(e) => setEditValues(prev => ({ 
                              ...prev, 
                              quantity: e.target.value ? parseFloat(e.target.value) : null 
                            }))}
                            className="h-8 w-20 text-right"
                          />
                        ) : (
                          item.quantity ?? '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editValues.rate ?? ''}
                            onChange={(e) => setEditValues(prev => ({ 
                              ...prev, 
                              rate: e.target.value ? parseFloat(e.target.value) : null 
                            }))}
                            className="h-8 w-20 text-right"
                          />
                        ) : (
                          item.rate ? formatCurrency(item.rate) : '-'
                        )}
                      </TableCell>
                    </>
                  )}
                  {showDates && (
                    <>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            type="date"
                            value={editValues.start_date || ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, start_date: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          item.start_date || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            type="date"
                            value={editValues.end_date || ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, end_date: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          item.end_date || '-'
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right font-mono">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.amount ?? 0}
                        onChange={(e) => setEditValues(prev => ({ 
                          ...prev, 
                          amount: parseFloat(e.target.value) || 0 
                        }))}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="h-8 w-28 text-right"
                      />
                    ) : (
                      <span
                        className={cn(
                          "cursor-pointer",
                          isEditable && "hover:text-primary"
                        )}
                        onClick={() => isEditable && startEditing(item)}
                      >
                        {formatCurrency(item.amount)}
                      </span>
                    )}
                  </TableCell>
                  {isEditable && (
                    <TableCell>
                      {editingId === item.id ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={saveEdit}>
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteLineItem.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Total Row */}
              <TableRow className="bg-muted/50 font-medium">
                {isEditable && <TableCell />}
                <TableCell>Total {title}</TableCell>
                {showQuantityRate && (
                  <>
                    <TableCell />
                    <TableCell />
                  </>
                )}
                {showDates && (
                  <>
                    <TableCell />
                    <TableCell />
                  </>
                )}
                <TableCell className="text-right font-mono">
                  {formatCurrency(total)}
                </TableCell>
                {isEditable && <TableCell />}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          No {title.toLowerCase()} added yet
          {isEditable && (
            <Button
              variant="link"
              size="sm"
              className="ml-1 p-0 h-auto"
              onClick={handleAdd}
            >
              Add one
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
