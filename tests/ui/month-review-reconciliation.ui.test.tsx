import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MonthReview from '../../src/screens/MonthReview'

const saveLaunchEntryMock = vi.fn()
const saveDeductionReconciliationMock = vi.fn()

vi.mock('../../src/components/ScreenContainer', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}))

vi.mock('../../src/screens/financialOverview', () => ({
  getMonthContext: () => ({
    companyId: 'cmp-ui',
    companyName: 'Empresa UI',
    month: '2026-05',
  }),
  getMonthlyOverview: () => ({
    summary: {
      operatingResult: 5000,
      taxRuleVersion: '2026.05',
      taxDerivationFingerprint: 'fp-123',
      accountantValidationWarning: 'Valide com contador.',
    },
    indicators: {
      netMarginPercent: 25,
      taxBurdenPercent: 8,
    },
    taxSupport: {
      audit: {
        lifecycleSnapshot: {
          status: 'open',
        },
      },
    },
  }),
  formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
  formatPercent: (value: number | null) => (value === null ? '—' : `${value}%`),
}))

vi.mock('../../src/monthLifecycle', () => ({
  monthLifecycleStore: {
    getStatus: () => ({
      companyId: 'cmp-ui',
      month: '2026-05',
      status: 'open',
      updatedAt: '2026-05-25T00:00:00.000Z',
      history: [],
      hasBeenClosed: false,
      closedAt: null,
      closedByRole: null,
    }),
    sendToReview: vi.fn(),
    moveBackToOpen: vi.fn(),
    reopenClosedMonth: vi.fn(),
    approveAndClose: vi.fn(),
    isMonthClosed: () => false,
  },
}))

vi.mock('../../src/launchStore', () => ({
  listLaunchEntries: () => [
    {
      id: 'est-01',
      companyId: 'cmp-ui',
      month: '2026-05',
      costType: 'company',
      dreGroup: 'deductions',
      categoryId: 'cat-company-deduction-taxes-sales',
      categoryName: 'Tributos sobre vendas',
      description: 'Dedução prevista sobre receita: Serviço A',
      amount: 80,
      createdAt: '2026-05-25T10:00:00.000Z',
      sourceType: 'tax_estimation',
      reviewStatus: 'approved',
      linkedEntryId: 'rev-01',
    },
  ],
  saveLaunchEntry: (...args: unknown[]) => saveLaunchEntryMock(...args),
}))

vi.mock('../../src/categoryStore', () => ({
  listCategories: ({ dreGroup }: { dreGroup: string }) => {
    if (dreGroup === 'deductions') {
      return [{ id: 'cat-company-deduction-taxes-sales', name: 'Tributos sobre vendas' }]
    }

    return [{ id: 'cat-company-revenue-services', name: 'Serviços' }]
  },
}))

vi.mock('../../src/reconciliationStore', () => ({
  getDeductionReconciliation: () => null,
  saveDeductionReconciliation: (...args: unknown[]) => saveDeductionReconciliationMock(...args),
}))

vi.mock('../../src/domain', () => ({
  MONTH_STATUS_VALUES: ['open', 'in_review', 'closed'],
  createLaunchEntry: ({ id, companyId, month, costType, description, amount }: Record<string, unknown>) => ({
    id,
    companyId,
    month,
    costType,
    description,
    amount,
    createdAt: '2026-05-25T12:00:00.000Z',
  }),
}))

describe('MonthReview reconciliation UI', () => {
  it('gera ajuste e salva reconciliacao', () => {
    render(<MonthReview />)

    const input = screen.getByPlaceholderText('0,00')
    fireEvent.change(input, { target: { value: '10000' } })

    fireEvent.click(screen.getByRole('button', { name: 'Gerar ajuste de reconciliação' }))

    expect(saveLaunchEntryMock).toHaveBeenCalled()
    expect(saveDeductionReconciliationMock).toHaveBeenCalled()
  })
})
