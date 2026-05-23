/**
 * RetailMind — useProducts hook
 * Generic data-fetching hook for any API call.
 */
import { useState, useEffect, useCallback } from 'react'

interface State<T> {
  data:    T | null
  loading: boolean
  error:   string | null
}

export function useFetch<T>(fetcher: (() => Promise<T>) | null): State<T> & { refetch: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: false, error: null })

  const run = useCallback(() => {
    if (!fetcher) return
    setState({ data: null, loading: true, error: null })
    fetcher()
      .then(data  => setState({ data, loading: false, error: null }))
      .catch(err  => setState({ data: null, loading: false, error: err?.message || 'Something went wrong' }))
  }, [fetcher])

  useEffect(() => { run() }, [run])

  return { ...state, refetch: run }
}

// Convenience: local wishlist stored in localStorage
export function useWishlist() {
  const KEY = 'rm_wishlist'
  const load = (): number[] => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  }
  const [ids, setIds] = useState<number[]>(load)

  const toggle = (productId: number) => {
    setIds(prev => {
      const next = prev.includes(productId) ? prev.filter(i => i !== productId) : [...prev, productId]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  return { wishlistIds: ids, toggle, has: (id: number) => ids.includes(id) }
}
