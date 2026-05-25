import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './screens/Dashboard'
import Launch from './screens/Launch'
import DRE from './screens/DRE'
import MonthReview from './screens/MonthReview'
import Training from './screens/Training'
import Records from './screens/Records'
import Categories from './screens/Categories'
import ChartOfAccounts from './screens/ChartOfAccounts'
import CategoryInsights from './screens/CategoryInsights'
import CashFlowProjection from './screens/CashFlowProjection'
import DeductionReview from './screens/DeductionReview'
import TaxProfileSettings from './screens/TaxProfileSettings'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/launch" element={<Launch />} />
      <Route path="/dre" element={<DRE />} />
      <Route path="/records" element={<Records />} />
      <Route path="/tax-profile" element={<TaxProfileSettings />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
      <Route path="/category-insights" element={<CategoryInsights />} />
      <Route path="/cash-flow-projection" element={<CashFlowProjection />} />
      <Route path="/deduction-review" element={<DeductionReview />} />
      <Route path="/month-review" element={<MonthReview />} />
      <Route path="/training" element={<Training />} />
    </Routes>
  )
}
