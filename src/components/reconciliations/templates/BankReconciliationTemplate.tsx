import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LineItemSection } from './LineItemSection';
import type { ReconciliationLineItem, ReconciliationTemplate } from '@/types/reconciliations';

interface BankReconciliationTemplateProps {
  reconciliationId: string;
  lineItems: ReconciliationLineItem[];
  glBalance: number;
  subBalance: number;
  isEditable: boolean;
  onLineItemsChange: () => void;
  template: ReconciliationTemplate | null;
}

export function BankReconciliationTemplate({
  reconciliationId,
  lineItems,
  glBalance,
  subBalance,
  isEditable,
  onLineItemsChange,
}: BankReconciliationTemplateProps) {
  // Calculate totals by section
  const calculations = useMemo(() => {
    const outstandingChecks = lineItems
      .filter(item => item.line_type === 'outstanding')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const depositsInTransit = lineItems
      .filter(item => item.line_type === 'deposit_in_transit')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const otherAdjustments = lineItems
      .filter(item => item.line_type === 'adjustment')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const adjustedBookBalance = glBalance - outstandingChecks + depositsInTransit + otherAdjustments;
    const variance = adjustedBookBalance - subBalance;
    
    return {
      outstandingChecks,
      depositsInTransit,
      otherAdjustments,
      adjustedBookBalance,
      variance,
    };
  }, [lineItems, glBalance, subBalance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bank Reconciliation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">GL Balance (Book)</span>
                <span className="font-mono">{formatCurrency(glBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Less: Outstanding Checks</span>
                <span className="font-mono text-destructive">({formatCurrency(calculations.outstandingChecks)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add: Deposits in Transit</span>
                <span className="font-mono text-green-600">{formatCurrency(calculations.depositsInTransit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other Adjustments</span>
                <span className="font-mono">{formatCurrency(calculations.otherAdjustments)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Adjusted Book Balance</span>
                <span className="font-mono">{formatCurrency(calculations.adjustedBookBalance)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Statement Balance</span>
                <span className="font-mono">{formatCurrency(subBalance)}</span>
              </div>
              <div className="h-[88px]" /> {/* Spacer to align with left column */}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Variance</span>
                <span className={`font-mono ${calculations.variance !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(calculations.variance)}
                </span>
              </div>
              {calculations.variance === 0 && (
                <div className="text-xs text-green-600 text-right">✓ Reconciled</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Item Sections */}
      <div className="space-y-6">
        <LineItemSection
          title="Outstanding Checks"
          lineType="outstanding"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Deposits in Transit"
          lineType="deposit_in_transit"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Other Adjustments"
          lineType="adjustment"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
      </div>
    </div>
  );
}
