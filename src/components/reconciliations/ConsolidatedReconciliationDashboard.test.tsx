import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsolidatedReconciliationDashboard } from '@/components/reconciliations/ConsolidatedReconciliationDashboard';

const hookMock = vi.fn();

vi.mock('@/hooks/useConsolidatedReconciliationSummary', () => ({
  useConsolidatedReconciliationSummary: (...args: unknown[]) => hookMock(...args),
}));

describe('ConsolidatedReconciliationDashboard', () => {
  beforeEach(() => {
    hookMock.mockReset();
  });

  it('shows empty state and allows viewing sample data', () => {
    hookMock.mockReturnValue({ data: null, isLoading: false, error: null });

    render(<ConsolidatedReconciliationDashboard entities={[]} />);

    expect(screen.getByText('No reconciliations available across entities.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View sample data' }));

    expect(screen.getByText('Entity Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Acme Holdings')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('toggles between live and sample data when live data exists', () => {
    hookMock.mockReturnValue({
      data: {
        totalReconciliations: 1,
        completionRate: 100,
        pendingReview: 0,
        rejected: 0,
        varianceTotal: 0,
        entities: [
          {
            entityId: 'e-1',
            entityName: 'Live Entity',
            total: 1,
            completed: 1,
            completionRate: 100,
            pendingReview: 0,
            rejected: 0,
            varianceTotal: 0,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<ConsolidatedReconciliationDashboard entities={[]} />);

    expect(screen.getByText('Live Entity')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View sample data' }));
    expect(screen.getByText('Acme Holdings')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View live data' }));
    expect(screen.getByText('Live Entity')).toBeInTheDocument();
  });
});
