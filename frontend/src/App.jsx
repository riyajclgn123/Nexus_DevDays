import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AuthPage          from './auth/AuthPage'
import PolicyDashboard   from './dashboards/policymaker/PolicyDashboard'
import FunderDashboard   from './dashboards/funder/FunderDashboard'
import OperatorDashboard from './dashboards/operator/OperatorDashboard'

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  if (loading) return <AppSpinner />
  if (!user)   return <Navigate to="/auth" replace />
  if (requiredRole && user.role !== requiredRole) return <Navigate to={`/dashboard/${user.role}`} replace />
  return children
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <AppSpinner />
  if (!user)   return <Navigate to="/auth" replace />
  return <Navigate to={`/dashboard/${user.role}`} replace />
}

function AppSpinner() {
  return (
    <div className="min-h-screen bg-navy dark:bg-navy flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-teal-3/30 border-t-teal-2 rounded-full animate-spin-slow" />
        <span className="font-mono text-xs text-slate-brand tracking-widest uppercase">Loading</span>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard/policymaker" element={<ProtectedRoute requiredRole="policymaker"><PolicyDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/funder"      element={<ProtectedRoute requiredRole="funder"><FunderDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/operator"    element={<ProtectedRoute requiredRole="operator"><OperatorDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
