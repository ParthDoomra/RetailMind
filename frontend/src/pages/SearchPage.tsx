import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, Grid2X2, List, Camera } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import CameraSearch from '../components/CameraSearch'
import { searchProducts, imageSearch } from '../services/apiClient'
import { useWishlist } from '../hooks/useProducts'
import type { Product } from '../types/productTypes'

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'rating'

function sortProducts(products: Product[], sort: SortKey): Product[] {
  return [...products].sort((a, b) => {
    if (sort === 'price_asc')  return (a.price  ?? 0) - (b.price  ?? 0)
    if (sort === 'price_desc') return (b.price  ?? 0) - (a.price  ?? 0)
    if (sort === 'rating')     return (b.rating ?? 0) - (a.rating ?? 0)
    return (b.relevance_score ?? 0) - (a.relevance_score ?? 0)
  })
}

export default function SearchPage() {
  const navigate                  = useNavigate()
  const [params, setParams]       = useSearchParams()
  const [results, setResults]     = useState<Product[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [query, setQuery]         = useState(params.get('q') || '')
  const [sort, setSort]           = useState<SortKey>('relevance')
  const [grid, setGrid]           = useState<'grid' | 'list'>('grid')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const [fallbackData, setFallbackData] = useState<any>(null)
  const { toggle, has }           = useWishlist()
  const handleWishlist = (p: import('../types/productTypes').Product) => toggle(p.id)

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true); setError(''); setQuery(q); setParams({ q }); setIsFallback(false); setFallbackData(null);
    try {
      const res = await searchProducts(q, 40)
      if (res.not_found_in_catalog) {
        setIsFallback(true)
        setFallbackData(res)
        setResults(res.similar_products || [])
      } else {
        setResults(res.results || [])
      }
    } catch {
      setError('Search failed. Is the backend running?')
    } finally { setLoading(false) }
  }, [setParams])

  const handleImageSearch = async (file: File) => {
    setLoading(true); setError(''); setIsFallback(false); setFallbackData(null);
    try {
      const res = await imageSearch(file)
      if (res.not_found_in_catalog) {
        setIsFallback(true)
        setFallbackData(res)
        setResults(res.similar_products || [])
        setQuery(res.query || 'Image search results')
      } else {
        setResults(res.results || [])
        setQuery(res.query || 'Image search results')
      }
    } catch {
      setError('Image search failed.')
    } finally { setLoading(false) }
  }

  const handleCameraResults = (products: Product[], capturedImage?: string) => {
    setCameraOpen(false)
    if (products.length > 0) {
      navigate(`/product/${products[0].id}`, { state: { capturedImage } })
    }
  }

  useEffect(() => {
    const q = params.get('q'); if (q) runSearch(q)
  }, []) // eslint-disable-line

  const sorted = sortProducts(results, sort)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 pt-24 pb-20"
    >
      {/* Search bar + camera button */}
      <div className="max-w-3xl mx-auto mb-8 flex gap-3">
        <div className="flex-1">
          <SearchBar onSearch={runSearch} onImageSearch={handleImageSearch}
            loading={loading} initialValue={query} />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCameraOpen(true)}
          className="flex items-center gap-2 bg-surface border border-border hover:border-accent/40 hover:bg-accent/10 text-gray-300 hover:text-accent px-4 rounded-2xl text-sm font-medium transition-all"
        >
          <Camera size={18} />
          <span className="hidden sm:inline">Camera</span>
        </motion.button>
      </div>

      {/* Fallback Banner */}
      {isFallback && fallbackData && (
        <div className="max-w-3xl mx-auto mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 animate-pulse">
            <SlidersHorizontal size={20} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-display font-bold text-sm text-amber-900">Product Not Found in Local Inventory</h4>
            <p className="text-xs text-amber-700 mt-1">
              Manual inventory match failed for <span className="font-semibold">"{query}"</span>. 
              Our AI inferred category <span className="font-semibold text-amber-800">"{fallbackData.inferred_category?.split('|')[0] || fallbackData.category?.split('|')[0]}"</span> (Estimated Pricing: <span className="font-bold text-amber-800">₹{fallbackData.estimated_price?.toLocaleString('en-IN') || fallbackData.results?.[0]?.price?.toLocaleString('en-IN')}</span>).
            </p>
            <p className="text-[10px] text-amber-600 mt-1">Showing similar matching alternatives from our inventory below:</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {results.length > 0 && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-sm text-gray-400">
            <span className="text-white font-medium">{results.length}</span> results
            {query && !['Image search results','Camera recognition results'].includes(query) && (
              <> for <span className="text-accent">"{query}"</span></>
            )}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 text-xs">
              {(['relevance','price_asc','price_desc','rating'] as SortKey[]).map(s => (
                <button key={s} onClick={() => setSort(s)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${sort===s ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}>
                  {s==='relevance'?'Best Match':s==='price_asc'?'Price ↑':s==='price_desc'?'Price ↓':'Rating'}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
              <button onClick={()=>setGrid('grid')} className={`p-1.5 rounded-lg ${grid==='grid'?'bg-accent text-white':'text-gray-500'}`}><Grid2X2 size={14}/></button>
              <button onClick={()=>setGrid('list')} className={`p-1.5 rounded-lg ${grid==='list'?'bg-accent text-white':'text-gray-500'}`}><List size={14}/></button>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner text="Searching..." />}
      {error   && <div className="text-center py-12 text-rose text-sm">{error}</div>}

      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-20 text-gray-500">
          <SlidersHorizontal size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-display">No results for "{query}"</p>
          <p className="text-sm mt-2">Try different words or use the camera to scan a product</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && !query && (
        <div className="text-center py-20 text-gray-600">
          <p className="font-display text-2xl mb-3">Search for any product</p>
          <p className="text-sm">or click <span className="text-accent">Camera</span> to recognize a product visually</p>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className={grid === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
          : 'flex flex-col gap-3'}>
          {sorted.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} onWishlist={handleWishlist} wishlisted={has(p.id)} />
          ))}
        </div>
      )}

      {/* Camera modal */}
      <AnimatePresence>
        {cameraOpen && (
          <CameraSearch onResults={handleCameraResults} onClose={() => setCameraOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
