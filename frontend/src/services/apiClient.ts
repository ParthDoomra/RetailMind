/**
 * RetailMind — API Client
 * All backend calls go through here. One place to change the base URL.
 */
import axios from 'axios'
import type { Product, SearchResponse, ProductInsights, AnalyticsDashboard, PaginatedProducts } from '../types/productTypes'

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api`, timeout: 15000 })

export const searchProducts = (query: string, limit = 20): Promise<SearchResponse> =>
  api.get('/search', { params: { q: query, limit } }).then(r => r.data)

export const getProduct = (id: number): Promise<Product> =>
  api.get(`/product/${id}`).then(r => r.data)

export const getProductInsights = (id: number): Promise<ProductInsights> =>
  api.get(`/product/${id}/insights`).then(r => r.data)

export const getRecommendations = (id: number, n = 8): Promise<{ recommendations: Product[] }> =>
  api.get(`/recommend/${id}`, { params: { n } }).then(r => r.data)

export const getDashboard = (): Promise<AnalyticsDashboard> =>
  api.get('/analytics/dashboard').then(r => r.data)

export const browseProducts = (params: {
  page?: number; per_page?: number; category?: string; sort?: string
}): Promise<PaginatedProducts> =>
  api.get('/products', { params }).then(r => r.data)

export const getCategories = (): Promise<{ name: string; count: number }[]> =>
  api.get('/categories').then(r => r.data)

export const imageSearch = (file: File): Promise<SearchResponse> => {
  const form = new FormData()
  form.append('image', file)
  return api.post('/image-search', form).then(r => r.data)
}

export default api
