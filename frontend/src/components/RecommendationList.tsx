import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import type { Product } from '../types/productTypes'

const FALLBACK = 'https://via.placeholder.com/80x80/141420/6c63ff?text=?'

interface Props { products: Product[]; title?: string }

export default function RecommendationList({ products, title = 'Similar Products' }: Props) {
  if (!products.length) return null
  return (
    <section>
      <h3 className="font-display text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
          >
            <Link to={`/product/${p.id}`}
              className="block bg-card border border-border hover:border-accent/30 rounded-xl p-3 transition-all group">
              <img src={p.image_url || FALLBACK}
                alt={p.name}
                className="w-full aspect-square object-contain mb-2 rounded-lg"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK }} />
              <p className="text-xs text-gray-300 line-clamp-2 group-hover:text-white transition-colors leading-snug">{p.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-semibold text-white">
                  {p.price ? `₹${p.price.toLocaleString('en-IN')}` : '—'}
                </span>
                {p.rating && (
                  <span className="flex items-center gap-0.5 text-xs text-amber">
                    <Star size={10} className="fill-amber" />
                    {p.rating.toFixed(1)}
                  </span>
                )}
              </div>
              {p.similarity_score !== undefined && (
                <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${p.similarity_score * 100}%` }} />
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
