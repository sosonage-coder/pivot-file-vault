import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LineItemSection } from './LineItemSection';
import type { ReconciliationLineItem, ReconciliationTemplate } from '@/types/reconciliations';
import { differenceInMonths, parseISO, format, addMonths } from 'date-fns';

interface PrepaidExpenseTemplateProps {
  reconciliationId: string;
  lineItems: ReconciliationLineItem[];
  glBalance: number;
  subBalance: number;
  isEditable: boolean;
  onLineItemsChange: () => void;
  template: ReconciliationTemplate | null;
}

export function PrepaidExpenseTemplate({
  reconciliationId,
  lineItems,
  glBalance,
  isEditable,
  onLineItemsChange,
}: PrepaidExpenseTemplateProps) {
  // Calculate amortization schedule from line items with dates
  const amortizationSchedule = useMemo(() => {
    const itemsWithDates = lineItems.filter(
      item => item.line_type === 'amortization' && item.start_date && item.end_date
    );
    
    if (itemsWithDates.length === 0) return [];
    
    // Build schedule for each prepaid item
    return itemsWithDates.map(item => {
      const startDate = parseISO(item.start_date!);
      const endDate = parseISO(item.end_date!);
      const totalMonths = differenceInMonths(endDate, startDate) + 1;
      const monthlyAmount = (item.amount || 0) / totalMonths;
      
      const schedule = [];
      for (let i = 0; i < totalMonths; i++) {
        const monthDate = addMonths(startDate, i);
        schedule.push({
          month: format(monthDate, 'MMM yyyy'),
          amount: monthlyAmount,
          remaining: item.amount! - (monthlyAmount * (i + 1)),
        });
      }
      
      return {
        description: item.description || 'Prepaid Item',
        originalAmount: item.amount || 0,
        startDate: item.start_date!,
        endDate: item.end_date!,
        totalMonths,
        monthlyAmount,
        schedule,
      };
    });
  }, [lineItems]);

  // Calculate totals
  const calculations = useMemo(() => {
    const totalOriginalAmount = lineItems
      .filter(item => item.line_type === 'amortization')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const totalAmortized = lineItems
      .filter(item => item.line_type === 'reversal')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    return {
      totalOriginalAmount,
      totalAmortized,
      remainingBalance: totalOriginalAmount - totalAmortized,
    };
  }, [lineItems]);

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
          <CardTitle className="text-base">Prepaid Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Original Amount</span>
              <p className="text-lg font-mono font-medium">{formatCurrency(calculations.totalOriginalAmount)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Total Amortized</span>
              <p className="text-lg font-mono font-medium text-destructive">
                ({formatCurrency(calculations.totalAmortized)})
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Remaining Balance</span>
              <p className="text-lg font-mono font-medium">{formatCurrency(calculations.remainingBalance)}</p>
            </div>
          </div>
          
          {calculations.remainingBalance !== glBalance && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Calculated remaining balance ({formatCurrency(calculations.remainingBalance)}) 
                differs from GL balance ({formatCurrency(glBalance)})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amortization Schedule */}
      {amortizationSchedule.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Amortization Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {amortizationSchedule.map((item, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{item.description}</h4>
                  <span className="text-sm text-muted-foreground">
                    {item.startDate} → {item.endDate} ({item.totalMonths} months)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max pb-2">
                    {item.schedule.slice(0, 12).map((month, monthIdx) => (
                      <div
                        key={monthIdx}
                        className="flex flex-col items-center p-2 rounded-md bg-muted/50 min-w-[80px]"
                      >
                        <span className="text-xs text-muted-foreground">{month.month}</span>
                        <span className="text-sm font-mono">{formatCurrency(month.amount)}</span>
                        <span className="text-xs text-muted-foreground">
                          Rem: {formatCurrency(month.remaining)}
                        </span>
                      </div>
                    ))}
                    {item.schedule.length > 12 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        +{item.schedule.length - 12} more months
                      </div>
                    )}
                  </div>
                </div>
                {idx < amortizationSchedule.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Line Item Sections */}
      <div className="space-y-6">
        <LineItemSection
          title="Prepaid Items"
          lineType="amortization"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
          showDates
        />
        
        <LineItemSection
          title="Period Amortization (Expense)"
          lineType="reversal"
          reconciliationId={reconciliationId}
          items={lineItems}
          isEditable={isEditable}
          onItemsChange={onLineItemsChange}
        />
      </div>
    </div>
  );
}
