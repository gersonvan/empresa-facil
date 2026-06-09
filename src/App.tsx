import { Routes, Route } from 'react-router-dom'
import Shell from './components/Shell'
import RequireAuth from './components/RequireAuth'
import AppRouter from './router'
import Login from './screens/Login'
import AuthCallback from './screens/AuthCallback'
import Onboarding from './screens/Onboarding'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
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
