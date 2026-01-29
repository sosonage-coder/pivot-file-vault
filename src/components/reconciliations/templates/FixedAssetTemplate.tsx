import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineItemSection } from './LineItemSection';
import type { ReconciliationLineItem, ReconciliationTemplate } from '@/types/reconciliations';

interface FixedAssetTemplateProps {
  reconciliationId: string;
  lineItems: ReconciliationLineItem[];
  glBalance: number;
  subBalance: number;
  isEditable: boolean;
  onLineItemsChange: () => void;
  template: ReconciliationTemplate | null;
}

export function FixedAssetTemplate({
  reconciliationId,
  lineItems,
  glBalance,
  isEditable,
  onLineItemsChange,
}: FixedAssetTemplateProps) {
  // Calculate fixed asset rollforward
  const calculations = useMemo(() => {
    const openingCost = lineItems
      .filter(item => item.line_type === 'opening')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const additions = lineItems
      .filter(item => item.line_type === 'addition')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const disposals = lineItems
      .filter(item => item.line_type === 'reversal')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const depreciation = lineItems
      .filter(item => item.line_type === 'depreciation')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const closingCost = openingCost + additions - disposals;
    const accumulatedDepreciation = depreciation;
    const netBookValue = closingCost - accumulatedDepreciation;
    const variance = netBookValue - glBalance;
    
    return {
      openingCost,
      additions,
      disposals,
      closingCost,
      depreciation,
      accumulatedDepreciation,
      netBookValue,
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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cost Rollforward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opening Cost</span>
                <span className="font-mono">{formatCurrency(calculations.openingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add: Additions</span>
                <span className="font-mono text-green-600">{formatCurrency(calculations.additions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Less: Disposals</span>
                <span className="font-mono text-destructive">({formatCurrency(calculations.disposals)})</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-medium">
                <span>Closing Cost</span>
                <span className="font-mono">{formatCurrency(calculations.closingCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Depreciation & NBV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Cost</span>
                <span className="font-mono">{formatCurrency(calculations.closingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Less: Accumulated Depreciation</span>
                <span className="font-mono text-destructive">({formatCurrency(calculations.accumulatedDepreciation)})</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-medium">
                <span>Net Book Value</span>
                <span className="font-mono">{formatCurrency(calculations.netBookValue)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">GL Balance</span>
                <span className="font-mono">{formatCurrency(glBalance)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Variance</span>
                <span className={`font-mono ${calculations.variance !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(calculations.variance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Item Sections */}
      <div className="space-y-6">
        <LineItemSection
          title="Opening Cost"
          lineType="opening"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Additions (CapEx)"
          lineType="addition"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Disposals"
          lineType="reversal"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Depreciation"
          lineType="depreciation"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
      </div>
    </div>
  );
}
