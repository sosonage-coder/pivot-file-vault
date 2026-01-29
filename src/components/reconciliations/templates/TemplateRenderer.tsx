import { useMemo } from 'react';
import type { 
  ReconciliationTemplate, 
  ReconciliationLineItem,
  ReconciliationTemplateType 
} from '@/types/reconciliations';
import { BankReconciliationTemplate } from './BankReconciliationTemplate';
import { PrepaidExpenseTemplate } from './PrepaidExpenseTemplate';
import { AccrualRollforwardTemplate } from './AccrualRollforwardTemplate';
import { FixedAssetTemplate } from './FixedAssetTemplate';
import { LeaseTemplate } from './LeaseTemplate';
import { GeneralTemplate } from './GeneralTemplate';

interface TemplateRendererProps {
  template: ReconciliationTemplate | null;
  reconciliationId: string;
  lineItems: ReconciliationLineItem[];
  glBalance: number;
  subBalance: number;
  isEditable: boolean;
  onLineItemsChange: () => void;
}

export function TemplateRenderer({
  template,
  reconciliationId,
  lineItems,
  glBalance,
  subBalance,
  isEditable,
  onLineItemsChange,
}: TemplateRendererProps) {
  const templateType = template?.template_type || 'general';
  
  const commonProps = useMemo(() => ({
    reconciliationId,
    lineItems,
    glBalance,
    subBalance,
    isEditable,
    onLineItemsChange,
    template,
  }), [reconciliationId, lineItems, glBalance, subBalance, isEditable, onLineItemsChange, template]);

  switch (templateType as ReconciliationTemplateType) {
    case 'bank':
      return <BankReconciliationTemplate {...commonProps} />;
    case 'prepaid':
      return <PrepaidExpenseTemplate {...commonProps} />;
    case 'accrual':
      return <AccrualRollforwardTemplate {...commonProps} />;
    case 'fixed_asset':
      return <FixedAssetTemplate {...commonProps} />;
    case 'lease':
      return <LeaseTemplate {...commonProps} />;
    default:
      return <GeneralTemplate {...commonProps} />;
  }
}
