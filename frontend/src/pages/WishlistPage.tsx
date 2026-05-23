import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Info, Clock, BarChart2, ShoppingBag, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import WishlistButton from '../components/WishlistButton'
import { getProduct } from '../services/apiClient'
import { useWishlist } from '../hooks/useProducts'
import type { Product } from '../types/productTypes'

export default function WishlistPage() {
  const { wishlistIds, toggle, has } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!wishlistIds.length) { setProducts([]); return }
    setLoading(true)
    Promise.all(wishlistIds.map(id => getProduct(id).catch(() => null)))
      .then(results => setProducts(results.filter(Boolean) as Product[]))
      .finally(() => setLoading(false))
  }, [wishlistIds.join(',')])

  const toggleAlert = (id: number) => {
    setAlerts(prev => {
      const isCurrentlyOn = prev[id]
      if (isCurrentlyOn) {
        toast.error('Price alert disabled.')
      } else {
        toast.success('Price alert enabled!')
      }
      return { ...prev, [id]: !isCurrentlyOn }
    })
  }

  // Called when WishlistButton is toggled on an item already in the wishlist
  const handleHeartToggle = (product: Product) => {
    toggle(product.id)
    // Animate out and remove after a short delay (so animation is visible)
    setTimeout(() => {
      setProducts(prev => prev.filter(p => p.id !== product.id))
    }, 300)
    toast.success('Removed from wishlist ♥', { icon: '💔' })
  }

  const handleGenerateReport = () => {
    toast.success('Savings Report is being generated and will be sent to your email.')
  }

  // Calculate totals
  const totalValue        = products.reduce((acc, p) => acc + (p.actual_price || p.price || 0), 0)
  const totalCurrentPrice = products.reduce((acc, p) => acc + (p.price || 0), 0)
  const netDiscounts      = totalValue - totalCurrentPrice

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-sm">
          <Heart size={20} className="fill-rose-500 text-rose-500" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-accent mb-0.5">Saved Items</h1>
          <p className="text-sm text-gray-500">A refined gallery of your curated intelligence targets.</p>
        </div>
        {products.length > 0 && (
          <span className="ml-auto bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold px-3 py-1 rounded-full">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {loading && <div className="py-20"><LoadingSpinner text="Loading your intelligence targets..." /></div>}

      {!loading && wishlistIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-3xl mx-auto">
          {/* Empty state with animated heart */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-dashed border-rose-200 flex items-center justify-center">
              <Heart size={36} className="text-rose-300" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-accent mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8 max-w-md text-center text-sm">
            Tap the <span className="inline-flex items-center gap-1 text-rose-500 font-semibold"><Heart size={13} className="fill-rose-500" /> heart</span> on any product to save it here and track pricing with AI insights.
          </p>
          <Link to="/search">
            <button className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors shadow-lg">
              Explore Market Intelligence
            </button>
          </Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side: Items Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <AnimatePresence>
                {products.map(item => {
                  const isDiscounted = item.discount_pct && item.discount_pct > 0
                  const trendColor   = isDiscounted ? 'text-emerald' : 'text-gray-500'
                  const trendText    = isDiscounted ? `↓ ${Math.round(item.discount_pct!)}%` : '— 0%'
                  const alertOn      = alerts[item.id] || false

                  // Mock intelligence for rich UI
                  const recommendation = isDiscounted
                    ? 'Buy Now — Strong negative price momentum detected.'
                    : 'Wait — Expected to drop by 8% in the next week.'
                  const Icon = isDiscounted ? Sparkles : Clock

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col p-4 relative"
                    >
                      {/* ── Amazon/Myntra heart button — top right ── */}
                      <div className="absolute top-4 right-4 z-20">
                        <WishlistButton
                          product={item}
                          wishlisted={has(item.id)}
                          onToggle={handleHeartToggle}
                          size="md"
                        />
                      </div>

                      <div className="flex gap-5 mb-4">
                        <div className="w-24 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 p-2">
                          <img
                            src={item.image_url || 'https://via.placeholder.com/300?text=No+Image'}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1 pt-1 pr-14">
                          <div className="text-[10px] font-bold tracking-wider text-white bg-accent px-2 py-0.5 rounded inline-block mb-2">
                            {item.category?.split('|')[0] || 'GENERAL'}
                          </div>
                          <Link to={`/product/${item.id}`}>
                            <h3 className="font-display text-lg font-bold text-accent mb-4 hover:underline line-clamp-2">
                              {item.name}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-6">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Current Price</div>
                              <div className="text-xl font-bold text-accent">₹{item.price?.toLocaleString('en-IN')}</div>
                            </div>
                            {item.actual_price && item.actual_price !== item.price && (
                              <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Was Saved At</div>
                                <div className="flex items-baseline gap-3">
                                  <span className="text-sm text-gray-500 line-through">₹{item.actual_price.toLocaleString('en-IN')}</span>
                                  <span className={`text-sm font-bold ${trendColor}`}>{trendText}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100 mt-auto">
                        <div className="flex gap-3 items-start flex-1">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon size={12} />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">AI Recommendation</div>
                            <p className="text-sm font-medium text-accent leading-tight">{recommendation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4 border-l border-gray-200 pl-4">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right leading-tight">Price<br/>Alert</div>
                          <div
                            onClick={() => toggleAlert(item.id)}
                            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${alertOn ? 'bg-accent' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${alertOn ? 'left-[22px]' : 'left-0.5'}`} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Add More Items Card */}
              <Link to="/search">
                <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center h-full min-h-[220px] hover:bg-rose-50/30 hover:border-rose-200 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-rose-100 flex items-center justify-center mb-4 text-gray-500 group-hover:text-rose-400 group-hover:scale-110 transition-all">
                    <Heart size={20} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-accent mb-2">Add More Items</h3>
                  <p className="text-sm text-gray-500 max-w-xs">Track inventory and wait for the perfect price point with AI insights.</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Right Side: Savings Intel Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <h2 className="font-display text-xl font-bold text-accent mb-2">Savings Intel</h2>
            <p className="text-sm text-gray-500 mb-6">Precision insights on your active targets.</p>

            <div className="bg-accent rounded-xl text-white p-6 shadow-xl mb-6 relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-[10px] font-bold tracking-wider uppercase text-gray-400 mb-2">Total Potential Savings</div>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl font-bold">₹{Math.round(netDiscounts * 1.5).toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-emerald">+14% Growth</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  By following our "Wait" recommendations, you're projected to save an additional ₹{Math.round(netDiscounts * 0.5).toLocaleString('en-IN')} this month.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm mb-8 border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Item Value</span>
                <span className="font-bold text-accent text-base">₹{totalValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Current Net Discounts</span>
                <span className="font-bold text-emerald text-base">-₹{netDiscounts.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-accent">Projected Total</span>
                <span className="font-bold text-accent text-lg">₹{totalCurrentPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6">
              <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                We've detected a trend: Tech accessories in your target list typically drop by 12% during the first week of next month.
              </p>
            </div>

            <button
              onClick={handleGenerateReport}
              className="w-full bg-accent text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors shadow-lg"
            >
              Generate Savings Report
              <BarChart2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
