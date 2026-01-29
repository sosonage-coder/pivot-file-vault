import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineItemSection } from './LineItemSection';
import type { ReconciliationLineItem, ReconciliationTemplate } from '@/types/reconciliations';

interface GeneralTemplateProps {
  reconciliationId: string;
  lineItems: ReconciliationLineItem[];
  glBalance: number;
  subBalance: number;
  isEditable: boolean;
  onLineItemsChange: () => void;
  template: ReconciliationTemplate | null;
}

export function GeneralTemplate({
  reconciliationId,
  lineItems,
  glBalance,
  subBalance,
  isEditable,
  onLineItemsChange,
}: GeneralTemplateProps) {
  // Calculate rollforward
  const calculations = useMemo(() => {
    const additions = lineItems
      .filter(item => item.line_type === 'addition')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const reversals = lineItems
      .filter(item => item.line_type === 'reversal')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const adjustments = lineItems
      .filter(item => item.line_type === 'adjustment')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const netAdjustments = additions - reversals + adjustments;
    const adjustedBalance = glBalance + netAdjustments;
    const variance = adjustedBalance - subBalance;
    
    return {
      additions,
      reversals,
      adjustments,
      netAdjustments,
      adjustedBalance,
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
          <CardTitle className="text-base">Reconciliation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">GL Balance</span>
                <span className="font-mono">{formatCurrency(glBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add: Additions</span>
                <span className="font-mono text-green-600">{formatCurrency(calculations.additions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Less: Reversals</span>
                <span className="font-mono text-destructive">({formatCurrency(calculations.reversals)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adjustments</span>
                <span className="font-mono">{formatCurrency(calculations.adjustments)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-medium">
                <span>Adjusted Balance</span>
                <span className="font-mono">{formatCurrency(calculations.adjustedBalance)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub-ledger Balance</span>
                <span className="font-mono">{formatCurrency(subBalance)}</span>
              </div>
              <div className="h-[88px]" />
              <div className="flex justify-between pt-2 border-t font-medium">
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
          title="Additions"
          lineType="addition"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Reversals"
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
