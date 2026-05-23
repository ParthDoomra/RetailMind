/**
 * RetailMind — Login Page
 * Google · Email/Password · Phone OTP
 * Matches app's light-theme design: white cards, gray-200 borders, accent navy
 */
import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ShieldCheck, Mail, Phone, ArrowRight,
  RefreshCw, ChevronLeft, Eye, EyeOff, Check
} from 'lucide-react'
import { RecaptchaVerifier } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

type Method = 'select' | 'email' | 'phone' | 'otp'
type EmailMode = 'signin' | 'signup'

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+1',  flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
  { code: '+971',flag: '🇦🇪', label: 'AE' },
]

export default function LoginPage() {
  const { user, loading, loginGoogle, loginEmail, signUpEmail, sendOtp, verifyOtp } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as any)?.from || '/'

  const [method,      setMethod]      = useState<Method>('select')
  const [emailMode,   setEmailMode]   = useState<EmailMode>('signin')
  const [showPw,      setShowPw]      = useState(false)
  const [googleBusy,  setGoogleBusy]  = useState(false)

  // Email fields
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Phone fields
  const [cc,          setCc]          = useState('+91')
  const [phone,       setPhone]       = useState('')
  const [otp,         setOtp]         = useState(['','','','','',''])
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs      = useRef<(HTMLInputElement | null)[]>([])
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)  // owned by this component

  useEffect(() => { if (user) navigate(from, { replace: true }) }, [user])

  // OTP resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() =>
        setResendTimer(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0 } return t - 1 }), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resendTimer])

  const fullPhone = `${cc}${phone.replace(/\D/g, '')}`

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    setGoogleBusy(true)
    const ok = await loginGoogle()
    if (!ok) setGoogleBusy(false)
  }

  const handleEmail = async () => {
    if (emailMode === 'signin') {
      await loginEmail(email, password)
    } else {
      await signUpEmail(email, password, name)
    }
  }

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 8) return

    // Clear any existing verifier and create a fresh one anchored to the live DOM div
    try { recaptchaRef.current?.clear() } catch {}
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        try { recaptchaRef.current?.clear() } catch {}
        recaptchaRef.current = null
      },
    })

    const ok = await sendOtp(fullPhone, recaptchaRef.current)
    if (ok) { setMethod('otp'); setResendTimer(30); setTimeout(() => otpRefs.current[0]?.focus(), 100) }
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) return
    await verifyOtp(code)
  }

  const handleResend = async () => {
    setOtp(['','','','','',''])
    // Create a fresh verifier for resend
    try { recaptchaRef.current?.clear() } catch {}
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    })
    await sendOtp(fullPhone, recaptchaRef.current)
    setResendTimer(30)
  }

  const goBack = (to: Method) => { setMethod(to); setOtp(['','','','','','']) }

  // ── Shared input style ─────────────────────────────────────────────────────
  const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all'

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-void flex"
    >
      {/* Invisible reCAPTCHA anchor — always in DOM, Firebase will use this */}
      <div id="recaptcha-container" style={{ position: 'fixed', bottom: 0, right: 0, zIndex: -1 }} />

      {/* ── Left Branded Panel ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 px-16 py-12 relative overflow-hidden">
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Glowing orbs */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-500/10 blur-2xl" />

        {/* Animated floating particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{ top: `${10 + i * 8}%`, left: `${10 + (i * 37) % 80}%` }}
            animate={{ opacity: [0.1, 0.6, 0.1], y: [0, -20, 0], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 border border-white/20 flex items-center justify-center shadow-lg shadow-violet-500/30"
          >
            <Sparkles size={16} className="text-white" />
          </motion.div>
          <span className="text-white font-bold text-lg tracking-tight">RetailMind</span>
          <span className="text-[10px] font-medium tracking-widest uppercase bg-white/10 border border-white/15 text-white/70 px-2 py-0.5 rounded-full ml-1">AI</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-[46px] font-bold text-white leading-[1.1] tracking-tight mb-4">
            Intelligence<br />
            <span className="bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">for Retail.</span>
          </h1>
          <p className="text-white/55 text-base leading-relaxed max-w-xs mb-10">
            The AI platform that transforms your retail data into actionable, real-time insights.
          </p>

          {/* Auth methods available */}
          <div className="flex flex-col gap-3">
            {[
              { icon: '🔵', label: 'Google Sign-In',    desc: 'One-click OAuth login' },
              { icon: '✉️', label: 'Email & Password',  desc: 'Classic secure login' },
              { icon: '📱', label: 'Phone OTP',         desc: 'Verify via SMS code' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-base">{icon}</span>
                <div>
                  <p className="text-white text-xs font-semibold">{label}</p>
                  <p className="text-white/40 text-[11px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-8 flex items-center gap-6 border-t border-white/10 pt-6">
            {[{ val: '1,465', label: 'Products' }, { val: '9', label: 'Categories' }, { val: '5', label: 'ML Models' }].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="text-white font-bold text-lg">{val}</div>
                <div className="text-white/40 text-[10px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <ShieldCheck size={13} className="text-white/25" />
          <span className="text-[11px] text-white/25">Secured by Firebase Authentication</span>
        </div>
      </div>

      {/* ── Right: Sign-In Form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles size={14} className="text-accent" />
            </div>
            <span className="font-display font-bold text-lg text-accent">RetailMind</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Method Selection ────────────────────────────────────────────── */}
            {method === 'select' && (
              <motion.div key="select"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="font-display text-3xl font-bold text-accent tracking-tight mb-1">Welcome back</h2>
                <p className="text-sm text-gray-500 mb-8">Sign in to your RetailMind workspace</p>

                {/* Google */}
                <AnimatePresence mode="wait">
                  {!googleBusy ? (
                    <motion.button key="g" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                      onClick={handleGoogle} disabled={loading}
                      className="group w-full flex items-center gap-4 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-800 font-semibold px-5 py-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow-md mb-3"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </svg>
                      <span className="flex-1 text-left text-sm">Continue with Google</span>
                      <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  ) : (
                    <motion.div key="gl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl py-4 px-5 shadow-sm mb-3"
                    >
                      <RefreshCw size={15} className="text-accent animate-spin" />
                      <span className="text-sm text-gray-600 font-medium">Connecting to Google...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setMethod('email')}
                  className="group w-full flex items-center gap-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-5 py-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow-md mb-3"
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-accent" />
                  </div>
                  <span className="flex-1 text-left text-sm">Continue with Email</span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>

                {/* Phone */}
                <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setMethod('phone')}
                  className="group w-full flex items-center gap-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-5 py-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-accent" />
                  </div>
                  <span className="flex-1 text-left text-sm">Continue with Phone</span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>

                <p className="text-[11px] text-gray-400 text-center mt-7 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <span className="text-accent font-medium hover:underline cursor-pointer">Terms</span>
                  {' '}and{' '}
                  <span className="text-accent font-medium hover:underline cursor-pointer">Privacy Policy</span>
                </p>
              </motion.div>
            )}

            {/* ── Email / Password ─────────────────────────────────────────────── */}
            {method === 'email' && (
              <motion.div key="email"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <button onClick={() => goBack('select')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent mb-6 transition-colors">
                  <ChevronLeft size={14} /> Back
                </button>

                <h2 className="font-display text-2xl font-bold text-accent tracking-tight mb-1">
                  {emailMode === 'signin' ? 'Sign in' : 'Create account'}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  {emailMode === 'signin' ? 'Enter your credentials to continue' : 'Fill in your details to get started'}
                </p>

                {/* Sign-in / Sign-up toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  {(['signin', 'signup'] as EmailMode[]).map(m => (
                    <button key={m} onClick={() => setEmailMode(m)}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${emailMode === m ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {m === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {emailMode === 'signup' && (
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Full name" className={inp} />
                  )}
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Email address" className={inp} />
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEmail()}
                      placeholder="Password" className={`${inp} pr-11`} />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={handleEmail}
                  disabled={loading || !email || !password || (emailMode === 'signup' && !name)}
                  className="mt-5 w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-accent/20"
                >
                  {loading
                    ? <><RefreshCw size={14} className="animate-spin" /> {emailMode === 'signin' ? 'Signing in...' : 'Creating account...'}</>
                    : <>{emailMode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={14} /></>
                  }
                </motion.button>
              </motion.div>
            )}

            {/* ── Phone Number Entry ───────────────────────────────────────────── */}
            {method === 'phone' && (
              <motion.div key="phone"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <button onClick={() => goBack('select')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent mb-6 transition-colors">
                  <ChevronLeft size={14} /> Back
                </button>

                <h2 className="font-display text-2xl font-bold text-accent tracking-tight mb-1">Enter your number</h2>
                <p className="text-sm text-gray-500 mb-6">We'll send a 6-digit verification code via SMS</p>

                <div className="flex gap-2 mb-5">
                  <select value={cc} onChange={e => setCc(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:border-accent/60 cursor-pointer appearance-none"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input type="tel" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^\d\s\-()+]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    placeholder="10-digit number" maxLength={14} autoFocus
                    className={`flex-1 ${inp}`}
                  />
                </div>

                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={handleSendOtp}
                  disabled={loading || phone.replace(/\D/g, '').length < 8}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-accent/20"
                >
                  {loading
                    ? <><RefreshCw size={14} className="animate-spin" /> Sending OTP...</>
                    : <><Phone size={14} /> Send OTP</>
                  }
                </motion.button>
              </motion.div>
            )}

            {/* ── OTP Verification ─────────────────────────────────────────────── */}
            {method === 'otp' && (
              <motion.div key="otp"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <button onClick={() => goBack('phone')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent mb-6 transition-colors">
                  <ChevronLeft size={14} /> Change number
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-accent tracking-tight">Verify OTP</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Sent to <span className="text-accent font-medium">{cc} {phone}</span></p>
                  </div>
                </div>

                {/* 6-box OTP */}
                <div className="flex gap-2.5 justify-center mb-6">
                  {otp.map((digit, i) => (
                    <input key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2
                        ${digit
                          ? 'border-accent bg-accent/5 text-accent focus:ring-accent/20'
                          : 'border-gray-200 bg-white text-gray-900 focus:border-accent/60 focus:ring-accent/10'
                        }`}
                    />
                  ))}
                </div>

                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={handleVerify}
                  disabled={loading || otp.join('').length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-accent/20 mb-4"
                >
                  {loading
                    ? <><RefreshCw size={14} className="animate-spin" /> Verifying...</>
                    : <><Check size={14} /> Verify & Continue</>
                  }
                </motion.button>

                <div className="text-center">
                  {resendTimer > 0
                    ? <p className="text-xs text-gray-400">Resend in <span className="text-accent font-bold">{resendTimer}s</span></p>
                    : <button onClick={handleResend} disabled={loading}
                        className="text-xs text-accent hover:underline disabled:opacity-50 font-medium">
                        Didn't receive it? Resend OTP
                      </button>
                  }
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
