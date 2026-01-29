import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineItemSection } from './LineItemSection';
import type { ReconciliationLineItem, ReconciliationTemplate } from '@/types/reconciliations';

interface AccrualRollforwardTemplateProps {
  reconciliationId: string;
  lineItems: ReconciliationLineItem[];
  glBalance: number;
  subBalance: number;
  isEditable: boolean;
  onLineItemsChange: () => void;
  template: ReconciliationTemplate | null;
}

export function AccrualRollforwardTemplate({
  reconciliationId,
  lineItems,
  glBalance,
  isEditable,
  onLineItemsChange,
}: AccrualRollforwardTemplateProps) {
  // Calculate rollforward
  const calculations = useMemo(() => {
    const openingBalance = lineItems
      .filter(item => item.line_type === 'opening')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const additions = lineItems
      .filter(item => item.line_type === 'addition')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const reversals = lineItems
      .filter(item => item.line_type === 'reversal')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const adjustments = lineItems
      .filter(item => item.line_type === 'adjustment')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const closingBalance = openingBalance + additions - reversals + adjustments;
    const variance = closingBalance - glBalance;
    
    return {
      openingBalance,
      additions,
      reversals,
      adjustments,
      closingBalance,
      variance,
    };
  }, [lineItems, glBalance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Rollforward Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accrual Rollforward</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Opening Balance</span>
              <span className="font-mono">{formatCurrency(calculations.openingBalance)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Add: New Accruals</span>
              <span className="font-mono text-green-600">
                {formatCurrency(calculations.additions)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Less: Reversals/Payments</span>
              <span className="font-mono text-destructive">
                ({formatCurrency(calculations.reversals)})
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Adjustments</span>
              <span className="font-mono">{formatCurrency(calculations.adjustments)}</span>
            </div>
            <div className="flex justify-between py-2 font-medium text-base">
              <span>Closing Balance (Calculated)</span>
              <span className="font-mono">{formatCurrency(calculations.closingBalance)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">GL Balance</span>
              <span className="font-mono">{formatCurrency(glBalance)}</span>
            </div>
            <div className="flex justify-between py-2 border-t font-medium">
              <span>Variance</span>
              <span className={`font-mono ${calculations.variance !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(calculations.variance)}
              </span>
            </div>
            
            {calculations.variance === 0 && (
              <div className="text-xs text-green-600 text-right">✓ Reconciled</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Item Sections */}
      <div className="space-y-6">
        <LineItemSection
          title="Opening Balance"
          lineType="opening"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="New Accruals (Additions)"
          lineType="addition"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Reversals / Payments"
          lineType="reversal"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Adjustments"
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
