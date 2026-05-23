import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProductInsightsPage from './pages/ProductInsightsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CompareProductsPage from './pages/CompareProductsPage'
import WishlistPage from './pages/WishlistPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const location = useLocation()
  const isAuth   = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-void relative text-accent">
      <Toaster position="top-right" toastOptions={{ style: { background: '#ffffff', color: '#0f172a', fontWeight: 'bold' } }} />
      {!isAuth && <Navbar />}
      <main className={`relative z-10 ${!isAuth ? 'pt-16' : ''}`}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/product/:id" element={<ProtectedRoute><ProductInsightsPage /></ProtectedRoute>} />
            <Route path="/analytics"   element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/compare"     element={<ProtectedRoute><CompareProductsPage /></ProtectedRoute>} />
            <Route path="/wishlist"    element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            <Route path="/about"       element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
