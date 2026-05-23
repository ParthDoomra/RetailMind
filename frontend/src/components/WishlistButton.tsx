/**
 * WishlistButton — Amazon / Myntra-style animated heart like button.
 * Features: heart pop, ring ripple, floating particle burst on "like".
 */
import { useState, useRef, useCallback } from 'react'
import { Heart } from 'lucide-react'
import type { Product } from '../types/productTypes'

interface Props {
  product: Product
  wishlisted: boolean
  onToggle: (p: Product) => void
  /** 'sm' = small card overlay  |  'md' = default  |  'lg' = product detail page */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// 8 particles at evenly spaced angles
const PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * 2 * Math.PI
  const dist  = 28
  return {
    tx: `${Math.round(Math.cos(angle) * dist)}px`,
    ty: `${Math.round(Math.sin(angle) * dist)}px`,
    color: i % 2 === 0 ? '#f43f5e' : '#fb923c',
  }
})

export default function WishlistButton({ product, wishlisted, onToggle, size = 'md', className = '' }: Props) {
  const [animating, setAnimating] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [localWishlisted, setLocalWishlisted] = useState(wishlisted)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // keep in sync if parent updates wishlisted prop
  if (localWishlisted !== wishlisted && !animating) {
    setLocalWishlisted(wishlisted)
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (animating) return

    const nextState = !localWishlisted
    setLocalWishlisted(nextState)
    setAnimating(true)
    if (nextState) setShowParticles(true)   // particles only on "like"

    onToggle(product)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setAnimating(false)
      setShowParticles(false)
    }, 600)
  }, [animating, localWishlisted, onToggle, product])

  const sizeMap = {
    sm: { btn: 'w-8 h-8',   icon: 14 },
    md: { btn: 'w-9 h-9',   icon: 16 },
    lg: { btn: 'w-12 h-12', icon: 22 },
  }
  const { btn, icon } = sizeMap[size]

  return (
    <button
      id={`wishlist-btn-${product.id}`}
      onClick={handleClick}
      aria-label={localWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={localWishlisted}
      className={`
        relative flex items-center justify-center rounded-full
        ${btn}
        ${localWishlisted
          ? 'bg-rose-50 border border-rose-200 shadow-[0_0_0_2px_rgba(244,63,94,0.15)]'
          : 'bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50'
        }
        transition-all duration-200 select-none
        ${className}
      `}
      style={{ zIndex: 20 }}
    >
      {/* ── Ripple ring (appears on like) ── */}
      {animating && localWishlisted && (
        <span
          className="heart-ripple absolute inset-0 rounded-full border-2 border-rose-400 pointer-events-none"
        />
      )}

      {/* ── Particle burst ── */}
      {showParticles && PARTICLES.map((p, i) => (
        <span
          key={i}
          className="heart-particle absolute w-1.5 h-1.5 rounded-full pointer-events-none"
          style={{
            background: p.color,
            '--tx': p.tx,
            '--ty': p.ty,
            animationDelay: `${i * 18}ms`,
          } as React.CSSProperties}
        />
      ))}

      {/* ── Heart icon ── */}
      <Heart
        size={icon}
        className={`
          ${animating ? 'heart-pop' : ''}
          transition-colors duration-150 pointer-events-none
          ${localWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400 hover:text-rose-400'}
        `}
      />
    </button>
  )
}
