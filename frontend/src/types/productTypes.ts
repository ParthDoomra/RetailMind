export interface Product {
  id:           number
  name:         string
  category:     string | null
  sub_category: string | null
  brand:        string | null
  description:  string | null
  price:        number | null
  actual_price: number | null
  discount_pct: number | null
  rating:       number | null
  review_count: number | null
  image_url:    string | null
  relevance_score?:  number
  similarity_score?: number
  key_features?:     string[]
}

export interface SearchResponse {
  query:   string
  results: Product[]
  total:   number
  not_found_in_catalog?: boolean
  similar_products?:     Product[]
  inferred_category?:    string
  estimated_price?:      number
}

export interface PriceForecast {
  history:  { date: string; price: number }[]
  forecast: { date: string; price: number; lower: number; upper: number }[]
  method:   string
}

export interface ProductInsights {
  product:        Product
  category_stats: { avg_price: number; min_price: number; max_price: number; avg_rating: number; product_count: number }
  rating_context: { label: string; delta: number }
  price_forecast: PriceForecast
  sentiment:      { summary_label: string; positive_pct: number; negative_pct: number; neutral_pct?: number; note?: string }
}

export interface AnalyticsDashboard {
  kpis:                { total_products: number; total_categories: number; avg_price: number; avg_rating: number }
  categories:          { name: string; count: number }[]
  price_distribution:  { bucket: string; count: number }[]
  rating_distribution: { rating: number; count: number }[]
  top_products:        { id: number; name: string; review_count: number; rating: number; price: number }[]
  recent_searches:     { query: string; result_count: number }[]
}

export interface PaginatedProducts {
  products:    Product[]
  total:       number
  page:        number
  per_page:    number
  total_pages: number
}
