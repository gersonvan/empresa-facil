import { Routes, Route } from 'react-router-dom'
import Shell from './components/Shell'
import RequireAuth from './components/RequireAuth'
import RequireGuest from './components/RequireGuest'
import RequireAdmin from './components/RequireAdmin'
import AppRouter from './router'
import Login from './screens/Login'
import AuthCallback from './screens/AuthCallback'
import Onboarding from './screens/Onboarding'
import AdminDashboard from './screens/AdminDashboard'
import AdminCompany from './screens/AdminCompany'
import AdminUsers from './screens/AdminUsers'
import Privacy from './screens/Privacy'
import Terms from './screens/Terms'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

      {/* Área administrativa — acesso exclusivo para is_admin = true */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Shell>
              <AdminDashboard />
            </Shell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/companies/:companyId"
        element={
          <RequireAdmin>
            <Shell>
              <AdminCompany />
            </Shell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <Shell>
              <AdminUsers />
            </Shell>
          </RequireAdmin>
        }
      />

      <Route
        path="/*"
        element={
          <RequireAuth>
            <Shell>
              <AppRouter />
            </Shell>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
