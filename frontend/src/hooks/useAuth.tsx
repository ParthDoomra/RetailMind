/**
 * RetailMind — Auth Context (Firebase)
 * Google Sign-In + Email/Password + Phone OTP
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPhoneNumber,
  type RecaptchaVerifier,
  signOut,
  type User as FirebaseUser,
  type ConfirmationResult,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  uid:    string
  name:   string
  email:  string | null
  avatar: string | null
  method: 'google' | 'email' | 'phone'
}

interface AuthCtx {
  user:        User | null
  loading:     boolean
  loginGoogle: () => Promise<boolean>
  loginEmail:  (email: string, password: string) => Promise<boolean>
  signUpEmail: (email: string, password: string, name: string) => Promise<boolean>
  sendOtp:     (phone: string, verifier: RecaptchaVerifier) => Promise<boolean>
  verifyOtp:   (otp: string) => Promise<boolean>
  logout:      () => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────

const Ctx = createContext<AuthCtx | null>(null)

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// ── Map Firebase User → our User type ────────────────────────────────────────

function mapFirebaseUser(fbUser: FirebaseUser, method: User['method'] = 'google'): User {
  return {
    uid:    fbUser.uid,
    name:   fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'User',
    email:  fbUser.email,
    avatar: fbUser.photoURL,
    method,
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Store the OTP confirmation result (set after sendOtp succeeds)
  const confirmationRef = useRef<ConfirmationResult | null>(null)

  // Listen to Firebase auth state (restores session on refresh)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Try to determine method from provider data
        const provider = fbUser.providerData[0]?.providerId
        const method: User['method'] =
          provider === 'google.com'   ? 'google' :
          provider === 'phone'        ? 'phone'  : 'email'
        setUser(mapFirebaseUser(fbUser, method))
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const loginGoogle = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      setUser(mapFirebaseUser(result.user, 'google'))
      toast.success(`Welcome, ${result.user.displayName ?? 'User'}! 🎉`)
      return true
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' ||
          err?.code === 'auth/cancelled-popup-request') return false
      toast.error('Google sign-in failed. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Email Sign-In ──────────────────────────────────────────────────────────
  const loginEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      setUser(mapFirebaseUser(result.user, 'email'))
      toast.success(`Welcome back, ${result.user.displayName ?? email.split('@')[0]}! 🎉`)
      return true
    } catch (err: any) {
      const msg =
        err?.code === 'auth/user-not-found'    ? 'No account found with this email.' :
        err?.code === 'auth/wrong-password'    ? 'Incorrect password. Please try again.' :
        err?.code === 'auth/invalid-credential'? 'Invalid email or password.' :
        err?.code === 'auth/too-many-requests' ? 'Too many attempts. Please wait.' :
        'Sign-in failed. Please try again.'
      toast.error(msg)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Email Sign-Up ──────────────────────────────────────────────────────────
  const signUpEmail = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      // Set display name
      await updateProfile(result.user, { displayName: name })
      setUser({ ...mapFirebaseUser(result.user, 'email'), name })
      toast.success(`Account created! Welcome, ${name}! 🎉`)
      return true
    } catch (err: any) {
      const msg =
        err?.code === 'auth/email-already-in-use' ? 'An account with this email already exists.' :
        err?.code === 'auth/weak-password'         ? 'Password must be at least 6 characters.' :
        err?.code === 'auth/invalid-email'         ? 'Please enter a valid email address.' :
        'Sign-up failed. Please try again.'
      toast.error(msg)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Send Phone OTP ─────────────────────────────────────────────────────────
  // verifier is created in LoginPage where the DOM anchor element is guaranteed live
  const sendOtp = useCallback(async (phone: string, verifier: RecaptchaVerifier): Promise<boolean> => {
    setLoading(true)
    try {
      const result = await signInWithPhoneNumber(auth, phone, verifier)
      confirmationRef.current = result
      toast.success('OTP sent! Check your SMS messages.', { icon: '📱' })
      return true
    } catch (err: any) {
      console.error('[Auth] sendOtp error:', err?.code, err?.message)
      const msg =
        err?.code === 'auth/invalid-phone-number'    ? 'Invalid phone number. Use country code e.g. +91XXXXXXXXXX.' :
        err?.code === 'auth/too-many-requests'        ? 'Too many attempts. Please wait a few minutes.' :
        err?.code === 'auth/quota-exceeded'           ? 'SMS quota exceeded. Try again later.' :
        err?.code === 'auth/captcha-check-failed'     ? 'reCAPTCHA check failed. Please refresh and try again.' :
        err?.code === 'auth/missing-phone-number'     ? 'Please enter a valid phone number.' :
        `OTP send failed (${err?.code ?? 'unknown'}). Try again.`
      toast.error(msg)
      try { verifier.clear() } catch {}
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Verify Phone OTP ───────────────────────────────────────────────────────
  const verifyOtp = useCallback(async (otp: string): Promise<boolean> => {
    if (!confirmationRef.current) {
      toast.error('Session expired. Please request OTP again.')
      return false
    }
    setLoading(true)
    try {
      const result = await confirmationRef.current.confirm(otp)
      setUser(mapFirebaseUser(result.user, 'phone'))
      confirmationRef.current = null
      toast.success('Phone verified successfully! Welcome! 🎉')
      return true
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-verification-code' ? 'Incorrect OTP. Please try again.' :
        err?.code === 'auth/code-expired'               ? 'OTP expired. Please resend.' :
        'Verification failed. Please try again.'
      toast.error(msg)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth)
      setUser(null)
      confirmationRef.current = null
      toast.success('Signed out successfully.')
    } catch {
      toast.error('Failed to sign out.')
    }
  }, [])

  return (
    <Ctx.Provider value={{ user, loading, loginGoogle, loginEmail, signUpEmail, sendOtp, verifyOtp, logout }}>
      {children}
    </Ctx.Provider>
  )
}
