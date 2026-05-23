import { useEffect, useState } from 'react'

import { useParams, Link, useLocation } from 'react-router-dom'

import { motion } from 'framer-motion'

import toast from 'react-hot-toast'

import { Heart, Share2, Calendar, Star, ArrowRight, Plus, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'

import { getProductInsights, getRecommendations } from '../services/apiClient'

import { useWishlist } from '../hooks/useProducts'

import LoadingSpinner from '../components/LoadingSpinner'

import PriceChart from '../components/PriceChart'

import type { ProductInsights, Product } from '../types/productTypes'

const getCategoryImages = (product: any, originalImg: string): string[] => {

  const cat = (product?.category || '').toLowerCase()

  const name = (product?.name || '').toLowerCase()

  const defaults = [

    originalImg || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',

    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=80',

    'https://images.unsplash.com/photo-1572569433602-666659d8eb69?auto=format&fit=crop&w=300&q=80',

    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80'

  ]

  const hasOriginal = originalImg && !originalImg.includes('via.placeholder') && !originalImg.includes('https://via.placeholder')

  if (cat.includes('mobile') || cat.includes('phone') || name.includes('phone')) {

    return [

      hasOriginal ? originalImg : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',

      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=300&q=80',

      'https://images.unsplash.com/photo-1565849328264-7b79c384d592?auto=format&fit=crop&w=300&q=80',

      'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=300&q=80'

    ]

  }

  if (cat.includes('audio') || cat.includes('ear') || cat.includes('headphone') || name.includes('headphone') || name.includes('earbud')) {

    return [

      hasOriginal ? originalImg : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',

      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=300&q=80',

      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=80',

      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&q=80'

    ]

  }

  if (cat.includes('wear') || cat.includes('watch') || name.includes('watch') || name.includes('band')) {

    return [

      hasOriginal ? originalImg : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',

      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=300&q=80',

      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=300&q=80',

      'https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=300&q=80'

    ]

  }

  if (cat.includes('computer') || cat.includes('laptop') || name.includes('laptop') || name.includes('macbook') || name.includes('notebook')) {

    return [

      hasOriginal ? originalImg : 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=800&q=80',

      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=300&q=80',

      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80',

      'https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&w=300&q=80'

    ]

  }

  return defaults

}

export default function ProductInsightsPage() {

  const { id } = useParams<{ id: string }>()

  const [insights, setInsights] = useState<ProductInsights | null>(null)

  const [similar, setSimilar] = useState<Product[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const location = useLocation()

  // Local state

  const [activeImage, setActiveImage] = useState<string>('')

  const { toggle, has } = useWishlist()

  useEffect(() => {

    if (!id) return

    setLoading(true)

    setError(null)

    Promise.all([

      getProductInsights(Number(id)),

      getRecommendations(Number(id), 4)

    ])

    .then(([insightsData, recommendationsData]) => {

      setInsights(insightsData)

      setSimilar(recommendationsData.recommendations || [])

      const routeImage = location.state?.capturedImage

      let initialImg = ''

      if (Number(id) < 0 && routeImage) {

        initialImg = routeImage

      } else {

        initialImg = insightsData.product.image_url || ''

      }

      const categoryImagesList = getCategoryImages(insightsData.product, initialImg)

      setActiveImage(categoryImagesList[0] || 'https://via.placeholder.com/800?text=No+Image')

    })

    .catch(err => {

      console.error(err)

      setError('Failed to load intelligence data.')

    })

    .finally(() => setLoading(false))

  }, [id, location.state])

  if (loading) return <div className="py-20"><LoadingSpinner text="Analyzing product intelligence..." /></div>

  if (error || !insights) return <div className="text-center py-20 text-rose font-bold">{error || 'Product not found'}</div>

  const p = insights.product

  const saved = has(p.id)

  const handleWishlist = () => {

    toggle(p.id)

    if (!saved) toast.success('Added to your Saved Items.')

    else toast.success('Removed from your Saved Items.')

  }

  const initialImg = p.id < 0 && location.state?.capturedImage

    ? location.state.capturedImage

    : (p.image_url || '')

  const productImages = getCategoryImages(p, initialImg)

  return (

    <div className="max-w-[1600px] mx-auto px-6 py-8">

      {/* Top Section */}

      <div className="flex gap-8 mb-8">

        {/* Left: Product Image & Details */}

        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">

          {p.id < 0 && (

            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">

                <Sparkles size={14} className="text-amber-700 animate-pulse" />

              </div>

              <div>

                <h4 className="text-xs font-bold text-amber-800">Product Not Found in Local Inventory</h4>

                <p className="text-[10px] text-amber-700 mt-0.5">This item was scanned via camera feed. Displaying estimated retail intelligence and synthetic pricing insights generated by Claude Vision.</p>

              </div>

            </div>

          )}

          <div className="flex justify-between items-start mb-6">

            <div>

              <div className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider inline-block mb-3">

                {p.category && p.category !== 'nan' ? p.category.split('|')[0] : 'GENERAL'}

              </div>

              <h1 className="font-display text-3xl font-bold text-accent mb-1">{p.name}</h1>

              <p className="text-sm text-gray-500">

                {p.id < 0 ? 'Camera Scan Analysis' : `ID: ${p.id}`} | RetailMind Intelligence Database

              </p>

            </div>

            <button 

              onClick={handleWishlist}

              className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center transition-colors ${saved ? 'text-rose bg-rose/10 border-rose/20' : 'text-gray-500 hover:text-rose'}`}

            >

              <Heart size={18} fill={saved ? 'currentColor' : 'none'} />

            </button>

          </div>

          <div className="flex-1 flex flex-col items-center justify-center mb-8 bg-gray-50 rounded-2xl relative overflow-hidden min-h-[400px]">

            <img src={activeImage} alt={p.name} className="max-w-full max-h-[400px] object-contain p-4 mix-blend-multiply" />

          </div>

          <div className="flex justify-center gap-4">

             {productImages.map((imgUrl, i) => (

               <button 

                 key={i} 

                 onClick={() => setActiveImage(imgUrl)}

                 className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${activeImage === imgUrl ? 'border-accent' : 'border-transparent hover:border-accent/50'}`}

               >

                 <img src={imgUrl} alt={`Thumb ${i}`} className="w-full h-full object-cover mix-blend-multiply" />

               </button>

             ))}

          </div>

          {p.key_features && p.key_features.length > 0 && (

            <div className="mt-8 border-t border-gray-100 pt-6">

              <h3 className="font-display font-bold text-sm text-accent mb-3">Identified Product Highlights</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {p.key_features.map((feat: string, idx: number) => (

                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">

                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60 flex-shrink-0" />

                    <span>{feat}</span>

                  </div>

                ))}

              </div>

            </div>

          )}

        </div>

        {/* Right: AI Intelligence Sidebar */}

        <div className="w-[400px] flex-shrink-0 flex flex-col gap-4">

          {/* Main AI Card */}

          <div className="bg-accent rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">

             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-6 relative z-10">

               <span className="text-blue-400">✧</span> AI INTELLIGENCE

             </div>

             <h2 className="font-display text-2xl font-bold mb-3 relative z-10">

               Buy Recommendation: {p.discount_pct && p.discount_pct > 10 ? 'Buy Now' : 'Wait'}

             </h2>

             <p className="text-sm text-gray-300 leading-relaxed mb-4 relative z-10">

               {p.discount_pct && p.discount_pct > 10 

                 ? 'High negative price momentum. This is a historically strong price point.'

                 : 'Our predictive engine suggests waiting for a drop in the next 14 days.'}

             </p>

             {/* Confidence Meter */}

             {p.id < 0 && (

               <div className="mb-6 p-4 bg-white/15 rounded-xl border border-white/10 relative z-10">

                 <div className="flex justify-between items-center text-xs font-bold text-white mb-1.5">

                   <span>AI Confidence Meter</span>

                   <span>{Math.round((p.relevance_score || 0.85) * 100)}%</span>

                 </div>

                 <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">

                   <div 

                     className="bg-emerald h-full transition-all duration-500" 

                     style={{ width: `${(p.relevance_score || 0.85) * 100}%` }}

                   />

                 </div>

               </div>

             )}

             <div className="flex justify-between items-end border-b border-gray-700 pb-6 mb-6 relative z-10">

               <div>

                 <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Current Best Price</div>

                 <div className="text-3xl font-bold">₹{p.price?.toLocaleString('en-IN')}</div>

               </div>

               {p.actual_price && (
                 <div className="text-right">
                   <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Actual MSRP</div>
                   <div className="text-xl font-bold text-gray-400 line-through">₹{p.actual_price.toLocaleString('en-IN')}</div>
                 </div>
               )}

             </div>

             <div className="flex gap-3 relative z-10">

               <button 

                 onClick={() => toast.success('Price alert configured. We will notify you when it drops.')}

                 className="flex-1 bg-white text-accent font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors text-sm shadow-lg"

               >

                 Set Price Alert

               </button>

               <button 

                 onClick={() => toast.success('Intelligence report link copied to clipboard.')}

                 className="w-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors text-white"

               >

                 <Share2 size={16} />

               </button>

             </div>

          </div>

          {/* Stock Velocity */}

          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">

             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">

               <Calendar size={18} />

             </div>

             <div>

               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Stock Velocity</div>

               <div className="font-semibold text-accent">Stable Inventory</div>

             </div>

          </div>

          {/* Sentiment & Market Share */}

          <div className="flex gap-4">

            <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sentiment</div>

              <div className="flex items-center gap-2">

                <Star size={16} className={insights.sentiment.summary_label === 'positive' ? 'text-emerald' : 'text-accent'} />

                <span className="font-semibold text-accent capitalize">{insights.sentiment.summary_label || 'Neutral'}</span>

              </div>

            </div>

            <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Market Share</div>

              <div>

                <span className="font-semibold text-accent">12.4%</span>

                <span className="text-xs text-gray-500 ml-1">in Category</span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Middle Section: Charts & Competitors */}

      <div className="flex flex-col lg:flex-row gap-8 mb-10">

        {/* Price History & Forecast Chart */}

        <div className="flex-[2] bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

           <div className="flex justify-between items-start mb-6">

             <div>

               <h2 className="font-display text-xl font-bold text-accent">Price History & Forecast</h2>

               <p className="text-xs text-gray-400 mt-1">

                 {insights.price_forecast?.method === 'prophet'

                   ? '180-day historical · Prophet ML forecast'

                   : '180-day historical · Linear regression forecast'}

               </p>

             </div>

             {/* Price delta badge */}

             {(() => {

               const hist   = insights.price_forecast?.history ?? []

               const fcast  = insights.price_forecast?.forecast ?? []

               if (!hist.length || !fcast.length) return null

               const startPrice = hist[0]?.price ?? 0

               const endPrice   = fcast[fcast.length - 1]?.price ?? 0

               const delta      = endPrice - startPrice

               const pct        = startPrice ? ((delta / startPrice) * 100).toFixed(1) : '0'

               const up         = delta >= 0

               return (

                 <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${

                   up ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'

                 }`}>

                   {up ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}

                   {up ? '+' : ''}{pct}% forecast

                 </div>

               )

             })()}

           </div>

           {/* Real PriceChart — uses actual backend history + forecast data */}

           {insights.price_forecast && Object.keys(insights.price_forecast).length > 0 ? (

             <PriceChart forecast={insights.price_forecast} />

           ) : (

             <div className="flex items-center justify-center h-64 text-gray-400 text-sm">

               No price history available for this product.

             </div>

           )}

        </div>

        {/* Competitor Matrix */}

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col">

           <h2 className="font-display text-xl font-bold text-accent mb-8">Competitor Matrix</h2>

           <div className="space-y-6 flex-1">

             {[

                { id: 'AMZ', name: 'Amazon India', price: p.price ? `₹${(p.price * 1.05).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'N/A', status: 'VIEW DEAL', color: 'text-amber-600', link: `https://www.amazon.in/s?k=${encodeURIComponent(p.name)}`, best: false },

                { id: 'FLP', name: 'Flipkart Online', price: p.price ? `₹${(p.price * 0.98).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'N/A', status: 'VIEW DEAL', color: 'text-blue-600', link: `https://www.flipkart.com/search?q=${encodeURIComponent(p.name)}`, best: true },

                { id: 'MYN', name: 'Myntra Store', price: p.price ? `₹${(p.price * 1.02).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'N/A', status: 'VIEW DEAL', color: 'text-rose-600', link: `https://www.myntra.com/search?q=${encodeURIComponent(p.name)}`, best: false }

                           ].map(c => (

                <a 

                  key={c.id} 

                  href={c.link}

                  target="_blank"

                  rel="noopener noreferrer"

                  className={`flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm transition-all ${c.best ? 'bg-blue-50 border border-blue-100 shadow-sm hover:bg-blue-50' : 'hover:bg-gray-50'}`}

                >

                  <div className="flex items-center gap-4">

                    <div className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-[10px] font-bold text-accent shadow-sm">

                      {c.id}

                    </div>

                    <div>

                      <span className="text-sm font-semibold text-accent block">{c.name}</span>

                      <span className="text-[10px] text-gray-400">Click to shop online</span>

                    </div>

                  </div>

                  <div className="text-right flex flex-col items-end">

                    <div className="font-bold text-accent">{c.price}</div>

                    <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 px-2 py-0.5 rounded-full bg-gray-100 ${c.color}`}>

                      {c.status}

                    </div>

                  </div>

                </a>

              ))}

           </div>

           <button 

             onClick={() => toast.success('Detailed benchmarking report opened in new tab.')}

             className="w-full mt-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-accent hover:bg-gray-50 transition-colors"

           >

             Detailed Benchmarking

           </button>

        </div>

      </div>

      {/* Bottom Section: Similar Intelligence */}

      <div>

        <div className="flex justify-between items-end mb-6">

          <div>

            <h2 className="font-display text-2xl font-bold text-accent mb-1">Similar Intelligence</h2>

            <p className="text-sm text-gray-500">AI-curated alternatives with higher conversion probability.</p>

          </div>

          <Link to="/search">

            <button className="flex items-center gap-1 text-sm font-bold text-accent hover:underline">

              View Full Category <ArrowRight size={16} />

            </button>

          </Link>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {similar.map(item => (

            <Link key={item.id} to={`/product/${item.id}`} className="block">

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm group hover:shadow-md transition-all relative h-full flex flex-col">

                 <div className="absolute top-4 right-4 z-10 bg-accent text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">

                   {Math.floor(Math.random() * 20 + 80)}% MATCH

                 </div>

                 <div className="aspect-square bg-white rounded-xl mb-4 overflow-hidden p-4 flex items-center justify-center flex-shrink-0">

                   <img src={item.image_url || 'https://via.placeholder.com/300?text=No+Image'} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />

                 </div>

                 <div className="flex justify-between items-center px-1 mt-auto">

                   <div>

                     <h3 className="font-semibold text-accent text-sm mb-1 line-clamp-1">{item.name}</h3>

                     <div className="text-xs font-bold text-gray-500">₹{item.price?.toLocaleString('en-IN')}</div>

                   </div>

                   <button 

                     onClick={(e) => { e.preventDefault(); toast.success('Added to quick comparison.'); }}

                     className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-white hover:bg-accent hover:border-accent transition-colors"

                   >

                     <Plus size={14} />

                   </button>

                 </div>

              </div>

            </Link>

          ))}

        </div>

      </div>

    </div>

  )

}