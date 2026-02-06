import type { DocumentStatus, PbcStatus } from '@/types/filegrid';
import type { ReconciliationStatus } from '@/types/reconciliations';

export type SharedReviewState = 'draft' | 'in_review' | 'final' | 'rejected';

export function mapDocumentToReviewState(status: DocumentStatus): SharedReviewState {
  if (status === 'Final') return 'final';
  return 'draft';
}

export function mapReconciliationToReviewState(status: ReconciliationStatus): SharedReviewState {
  if (status === 'rejected') return 'rejected';
  if (status === 'approved' || status === 'certified') return 'final';
  if (status === 'pending_review') return 'in_review';
  return 'draft';
}

export function mapPbcToReviewState(status: PbcStatus): SharedReviewState {
  if (status === 'Complete') return 'final';
  if (status === 'Uploaded' || status === 'Reviewed') return 'in_review';
  return 'draft';
}
