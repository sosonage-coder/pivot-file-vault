import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LineItemSection } from './LineItemSection';
import type { ReconciliationLineItem, ReconciliationTemplate } from '@/types/reconciliations';

interface LeaseTemplateProps {
  reconciliationId: string;
  lineItems: ReconciliationLineItem[];
  glBalance: number;
  subBalance: number;
  isEditable: boolean;
  onLineItemsChange: () => void;
  template: ReconciliationTemplate | null;
}

// Present Value calculation helper
function calculatePV(payment: number, rate: number, periods: number): number {
  if (rate === 0) return payment * periods;
  const monthlyRate = rate / 100 / 12;
  return payment * ((1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate);
}

export function LeaseTemplate({
  reconciliationId,
  lineItems,
  glBalance,
  isEditable,
  onLineItemsChange,
}: LeaseTemplateProps) {
  // Lease parameters (could be stored in metadata or as line items)
  const [leaseParams, setLeaseParams] = useState({
    monthlyPayment: 0,
    discountRate: 5,
    leaseTerm: 60,
  });

  // Calculate lease liability and ROU asset
  const calculations = useMemo(() => {
    const openingLiability = lineItems
      .filter(item => item.line_type === 'opening')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const interestExpense = lineItems
      .filter(item => item.line_type === 'interest')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const principalPayments = lineItems
      .filter(item => item.line_type === 'principal')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const closingLiability = openingLiability + interestExpense - principalPayments;
    
    // Calculate PV based on params
    const presentValue = calculatePV(
      leaseParams.monthlyPayment,
      leaseParams.discountRate,
      leaseParams.leaseTerm
    );
    
    const variance = closingLiability - glBalance;
    
    return {
      openingLiability,
      interestExpense,
      principalPayments,
      closingLiability,
      presentValue,
      variance,
    };
  }, [lineItems, glBalance, leaseParams]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Lease Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lease Parameters (IFRS 16)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyPayment">Monthly Payment</Label>
              <Input
                id="monthlyPayment"
                type="number"
                step="0.01"
                value={leaseParams.monthlyPayment}
                onChange={(e) => setLeaseParams(prev => ({ 
                  ...prev, 
                  monthlyPayment: parseFloat(e.target.value) || 0 
                }))}
                disabled={!isEditable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountRate">Discount Rate (%)</Label>
              <Input
                id="discountRate"
                type="number"
                step="0.1"
                value={leaseParams.discountRate}
                onChange={(e) => setLeaseParams(prev => ({ 
                  ...prev, 
                  discountRate: parseFloat(e.target.value) || 0 
                }))}
                disabled={!isEditable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseTerm">Lease Term (months)</Label>
              <Input
                id="leaseTerm"
                type="number"
                value={leaseParams.leaseTerm}
                onChange={(e) => setLeaseParams(prev => ({ 
                  ...prev, 
                  leaseTerm: parseInt(e.target.value) || 0 
                }))}
                disabled={!isEditable}
              />
            </div>
          </div>
          
          {leaseParams.monthlyPayment > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm">
                <span className="text-muted-foreground">Present Value (Day 1):</span>{' '}
                <span className="font-mono font-medium">{formatCurrency(calculations.presentValue)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liability Rollforward */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lease Liability Rollforward</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Opening Liability</span>
              <span className="font-mono">{formatCurrency(calculations.openingLiability)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Add: Interest Expense (Unwinding)</span>
              <span className="font-mono text-amber-600">
                {formatCurrency(calculations.interestExpense)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Less: Principal Payments</span>
              <span className="font-mono text-green-600">
                ({formatCurrency(calculations.principalPayments)})
              </span>
            </div>
            <div className="flex justify-between py-2 font-medium text-base">
              <span>Closing Liability</span>
              <span className="font-mono">{formatCurrency(calculations.closingLiability)}</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">GL Balance</span>
              <span className="font-mono">{formatCurrency(glBalance)}</span>
            </div>
            <div className="flex justify-between py-2 font-medium">
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
          title="Opening Liability"
          lineType="opening"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Interest Expense"
          lineType="interest"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
        
        <LineItemSection
          title="Principal Payments"
          lineType="principal"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
      </div>
    </div>
  );
}
