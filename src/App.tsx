import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppShell } from './components/layout'
import { ConfirmHost, ToastHost } from './components/kit'
import { useAppState } from './data/store'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Farmers from './screens/Farmers'
import FarmerDetail from './screens/FarmerDetail'
import FarmerForm from './screens/FarmerForm'
import NewVisit from './screens/NewVisit'
import Investments from './screens/Investments'
import Expenses from './screens/Expenses'
import Analytics from './screens/Analytics'
import SyncCenter from './screens/SyncCenter'

function ProtectedApp() {
  const authenticated = useAppState((s) => s.auth.authenticated)
  if (!authenticated) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/farmers/new" element={<FarmerForm />} />
        <Route path="/farmers/:id" element={<FarmerDetail />} />
        <Route path="/farmers/:id/edit" element={<FarmerForm />} />
        <Route path="/farmers/:id/visit" element={<NewVisit />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/sync" element={<SyncCenter />} />
      </Routes>
      <ToastHost />
      <ConfirmHost />
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App