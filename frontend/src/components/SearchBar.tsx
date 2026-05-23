import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Upload, X, Loader2 } from 'lucide-react'

interface Props {
  onSearch:      (query: string) => void
  onImageSearch?: (file: File) => void
  loading?:      boolean
  placeholder?:  string
  initialValue?: string
}

export default function SearchBar({ onSearch, onImageSearch, loading, placeholder = 'Search products...', initialValue = '' }: Props) {
  const [query, setQuery]   = useState(initialValue)
  const [dragging, setDrag] = useState(false)
  const fileRef             = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  const handleFile = (file: File) => {
    if (onImageSearch && file.type.startsWith('image/')) onImageSearch(file)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`relative flex items-center gap-2 bg-white border rounded-2xl px-4 py-3 transition-all duration-300
          ${dragging ? 'border-accent shadow-md' : 'border-gray-300 hover:border-gray-400 focus-within:border-accent focus-within:shadow-sm'}`}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if(f) handleFile(f) }}
      >
        <Search size={18} className="text-gray-500 flex-shrink-0" />

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none"
        />

        {query && (
          <button type="button" onClick={() => setQuery('')} className="text-gray-600 hover:text-gray-400">
            <X size={16} />
          </button>
        )}

        {onImageSearch && (
          <>
            <div className="w-px h-5 bg-border" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent transition-colors px-1"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Image</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f) }} />
          </>
        )}

        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          disabled={loading || !query.trim()}
          className="flex-shrink-0 flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          <span className="hidden sm:inline">Search</span>
        </motion.button>
      </div>
    </form>
  )
}
