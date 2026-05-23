/**
 * RetailMind — Protected Route
 * Redirects unauthenticated users to /login and restores their intended destination.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // While Firebase resolves the auth session, show a branded full-screen loader
  if (loading) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-6">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5"
        >
          {/* Spinning ring with logo */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-[3px] border-accent/10 border-t-accent animate-spin" />
            <div className="absolute inset-[6px] rounded-full bg-accent/10 flex items-center justify-center">
              <Sparkles size={16} className="text-accent" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-accent">RetailMind</p>
            <p className="text-xs text-gray-400 mt-0.5">Verifying your session...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Not authenticated → redirect to login, preserving intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
