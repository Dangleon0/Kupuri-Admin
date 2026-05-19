import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import ComplimentaryPage from './pages/ComplimentaryPage'
import OrdersPage from './pages/OrdersPage'
import ScannerPage from './pages/ScannerPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={user?.role === 'STAFF_SCANNER' ? '/scan' : '/login'} replace />
  }
  return children
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute roles={['ADMIN']}><EventsPage /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute roles={['ADMIN']}><EventDetailPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute roles={['ADMIN']}><OrdersPage /></ProtectedRoute>} />
          <Route path="/complimentary" element={<ProtectedRoute roles={['ADMIN']}><ComplimentaryPage /></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute roles={['ADMIN', 'STAFF_SCANNER']}><ScannerPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
