import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut, ChevronDown, Sparkles } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const NAV_LINKS = [
  { to: '/',          label: 'Dashboard' },
  { to: '/analytics', label: 'Insights' },
  { to: '/compare',   label: 'Compare' },
  { to: '/wishlist',  label: 'Wishlist' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [q, setQ] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login')
  }

  // Generate initials avatar fallback
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RM'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm shadow-black/5' : 'bg-white border-b border-gray-100'}`}>
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        
        {/* Left: Logo & Links */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-sm"
            >
              <Sparkles size={13} className="text-white" />
            </motion.div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-violet-700 via-blue-700 to-slate-800 bg-clip-text text-transparent">
              RetailMind
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 h-full">
            {NAV_LINKS.map(({ to, label }) => {
              const active = pathname === to || (to === '/' && pathname === '/search')
              return (
                <Link key={to} to={to} className="relative h-16 flex items-center group">
                  <span className={`text-sm font-medium transition-colors ${active ? 'text-violet-700' : 'text-gray-500 group-hover:text-violet-600'}`}>
                    {label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl hidden lg:block">
          <form onSubmit={handleSearch} className="relative w-full flex items-center">
            <Search size={16} className="absolute left-4 text-gray-400" />
            <input 
              type="text" 
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search product SKU..."
              className="w-full bg-void border border-border text-sm rounded-full pl-10 pr-4 py-2 outline-none focus:border-accent transition-colors text-gray-900 placeholder-gray-500"
            />
          </form>
        </div>

        {/* Right: Bell + User Avatar / Sign In */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button className="text-gray-500 hover:text-accent transition-colors">
            <Bell size={18} />
          </button>

          {user ? (
            /* ── User Avatar + Dropdown ──────────────────────────────────── */
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-avatar-btn"
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2.5 hover:bg-gray-50 rounded-full pl-1 pr-3 py-1 transition-colors group"
              >
                {/* Avatar */}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold border-2 border-gray-200">
                    {initials}
                  </div>
                )}
                {/* Name (desktop only) */}
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/8 overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Logout */}
                    <button
                      id="logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* ── Sign In Button ──────────────────────────────────────────── */
            <Link
              to="/login"
              className="bg-accent text-white text-xs font-semibold px-5 py-2 rounded-full hover:bg-accent/90 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
