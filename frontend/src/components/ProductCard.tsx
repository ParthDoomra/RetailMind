import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Star, TrendingDown, ArrowRight } from 'lucide-react'
import type { Product } from '../types/productTypes'
import WishlistButton from './WishlistButton'

interface Props {
  product: Product
  index?: number
  onWishlist?: (p: Product) => void
  wishlisted?: boolean
}

const FALLBACK_IMG = 'https://via.placeholder.com/300x300/f3f4f6/6b7280?text=No+Image'

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: 'text-sky-600',
  Clothing: 'text-violet-600',
  'Home & Kitchen': 'text-amber-600',
  Books: 'text-emerald-600',
  Sports: 'text-rose-600',
  Toys: 'text-orange-600',
  Beauty: 'text-pink-600',
  Automotive: 'text-slate-600',
  Garden: 'text-green-600',
}

export default function ProductCard({ product, index = 0, onWishlist, wishlisted = false }: Props) {
  const price       = product.price ? `₹${product.price.toLocaleString('en-IN')}` : '—'
  const actualPrice = product.actual_price ? `₹${product.actual_price.toLocaleString('en-IN')}` : null
  const discount    = product.discount_pct ? `${Math.round(product.discount_pct)}% off` : null
  const catColor    = product.category ? (CATEGORY_COLORS[product.category] ?? 'text-violet-600') : 'text-violet-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-300"
    >
      {/* Shimmer sweep effect on hover */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 z-10 pointer-events-none" />

      {/* Discount badge */}
      {discount && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          <TrendingDown size={10} />
          {discount}
        </div>
      )}

      {/* Wishlist heart button */}
      {onWishlist && (
        <div className="absolute top-3 right-3 z-20">
          <WishlistButton
            product={product}
            wishlisted={wishlisted}
            onToggle={onWishlist}
            size="sm"
          />
        </div>
      )}

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-100">
        <img
          src={product.image_url || FALLBACK_IMG}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {product.category && (
          <span className={`text-xs font-semibold uppercase tracking-wider ${catColor}`}>
            {product.category}
          </span>
        )}

        <Link to={`/product/${product.id}`}>
          <h3 className="mt-1 text-sm font-medium text-gray-900 line-clamp-2 hover:text-violet-700 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star
                  key={i}
                  size={11}
                  className={i <= Math.round(product.rating!) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {product.rating.toFixed(1)}
              {product.review_count ? ` (${product.review_count.toLocaleString()})` : ''}
            </span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-base font-bold text-gray-900">{price}</span>
          {actualPrice && (
            <span className="text-xs text-gray-400 line-through">{actualPrice}</span>
          )}
        </div>

        {/* Relevance score badge (search results) */}
        {product.relevance_score !== undefined && (
          <div className="mt-2 text-xs text-gray-400">
            Match: <span className="text-violet-600 font-semibold">{(product.relevance_score * 100).toFixed(0)}%</span>
          </div>
        )}

        <Link to={`/product/${product.id}`}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold hover:from-violet-700 hover:to-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-violet-200"
          >
            View Insights
            <ArrowRight size={12} />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}
