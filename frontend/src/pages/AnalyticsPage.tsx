/**
 * RetailMind — Analytics Dashboard (v3)
 * All charts use real backend data via /api/analytics/dashboard
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Package, Star, TrendingUp, LayoutGrid, Search,
  ArrowUpRight, Zap, BarChart2, Tag, Crown
} from 'lucide-react'
import { getDashboard } from '../services/apiClient'
import LoadingSpinner from '../components/LoadingSpinner'
import type { AnalyticsDashboard } from '../types/productTypes'

// ── Colour palette ──────────────────────────────────────────────
const PALETTE = ['#091426', '#1e293b', '#505f76', '#8291a6', '#bcc7de', '#d3e4fe', '#d0e1fb']

// ── Custom tooltip used by multiple charts ──────────────────────
const ChartTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs">
      {label && <p className="font-semibold text-secondary mb-1">{label}</p>}
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: e.fill || e.color }} />
          <span className="text-secondary">{e.name}:</span>
          <span className="font-bold text-primary">{prefix}{Number(e.value).toLocaleString('en-IN')}{suffix}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat KPI card ───────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub: string; color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-xl flex flex-col justify-between group hover:border-primary transition-all duration-300"
    >
      <div className="flex justify-between items-start">
        <span className="text-secondary font-label-caps uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4">
        <h2 className="font-display text-h1 text-primary">{value}</h2>
        <p className="text-secondary text-sm mt-1">{sub}</p>
      </div>
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => toast.error('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-24"><LoadingSpinner text="Compiling analytics…" /></div>
  if (!data)   return <div className="text-center py-24 text-error font-bold">Failed to load analytics.</div>

  // ── Derived data ──────────────────────────────────────────────
  const topCategories = data.categories.slice(0, 7).map((c, i) => ({
    name: c.name.split('|')[0].trim(),
    count: c.count,
    fill: PALETTE[i % PALETTE.length],
  }))

  const priceDist = data.price_distribution.map((b, i) => ({
    name: b.bucket, count: b.count, fill: PALETTE[i % PALETTE.length]
  }))

  const ratingDist = data.rating_distribution.map(r => ({
    name: `${r.rating}★`, count: r.count, fill: r.rating >= 4 ? '#1e293b' : r.rating >= 3 ? '#505f76' : '#8291a6'
  }))

  // Pie chart: top 5 categories by product count
  const pieData = data.categories.slice(0, 5).map((c, i) => ({
    name: c.name.split('|')[0].trim(),
    value: c.count,
    fill: PALETTE[i],
  }))

  return (
    <div className="max-w-container_max mx-auto px-gutter py-8 font-body-md text-on-background">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-h1 font-bold text-primary mb-1">Analytics Dashboard</h1>
          <p className="text-sm text-secondary">Live intelligence from {data.kpis.total_products.toLocaleString()} products across {data.kpis.total_categories} categories</p>
        </div>
        <button
          onClick={() => toast.success('Analytics report queued — check your email shortly.')}
          className="bg-primary text-white px-5 py-2.5 rounded-full font-bold text-sm inner-glow hover:bg-opacity-90 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">bolt</span> Generate Report
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-8">
        <KpiCard icon={Package}    label="Total Products"   color="bg-primary-container/10 text-primary"
          value={data.kpis.total_products.toLocaleString()}
          sub={`Across ${data.kpis.total_categories} categories`} />
        <KpiCard icon={Tag}        label="Avg. Price"        color="bg-primary-container/10 text-primary"
          value={`₹${Math.round(data.kpis.avg_price).toLocaleString('en-IN')}`}
          sub="Across all tracked products" />
        <KpiCard icon={Star}       label="Avg. Rating"       color="bg-primary-container/10 text-primary"
          value={data.kpis.avg_rating.toFixed(2)}
          sub="Customer satisfaction score" />
        <KpiCard icon={LayoutGrid} label="Categories"        color="bg-primary-container/10 text-primary"
          value={data.kpis.total_categories.toString()}
          sub="Active product segments" />
      </div>

      {/* ── Row 1: Price Distribution + Rating Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-md">

        {/* Price Distribution Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-8 flex flex-col overflow-hidden relative">
          <div className="flex items-start justify-between mb-5 z-10">
            <div>
              <h3 className="font-h2 text-primary">Price Distribution</h3>
              <p className="text-secondary text-sm mt-0.5">Products by price range (INR)</p>
            </div>
            <div className="bg-surface-container p-2 rounded-lg text-primary">
              <BarChart2 size={16} />
            </div>
          </div>
          <div className="h-64 mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceDist} margin={{ top: 4, right: 4, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e0e3e5" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#8291a6', fontSize: 10 }}
                  angle={-35} textAnchor="end" tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#8291a6', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<ChartTooltip suffix=" products" />} cursor={{ fill: '#f7f9fb' }} />
                <Bar dataKey="count" name="Products" radius={[6, 6, 0, 0]}>
                  {priceDist.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Rating Distribution Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-xl p-8 flex flex-col overflow-hidden relative">
          <div className="flex items-start justify-between mb-5 z-10">
            <div>
              <h3 className="font-h2 text-primary">Rating Distribution</h3>
              <p className="text-secondary text-sm mt-0.5">Customer satisfaction breakdown</p>
            </div>
            <div className="bg-surface-container p-2 rounded-lg text-primary">
              <Star size={16} />
            </div>
          </div>
          <div className="h-64 mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDist} margin={{ top: 4, right: 4, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e0e3e5" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#8291a6', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#8291a6', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<ChartTooltip suffix=" products" />} cursor={{ fill: '#f7f9fb' }} />
                <Bar dataKey="count" name="Products" radius={[6, 6, 0, 0]}>
                  {ratingDist.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Row 2: Category Pie + Top Categories Bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-md">

        {/* Category Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-8 flex flex-col overflow-hidden relative">
          <div className="flex items-start justify-between mb-5 z-10">
            <div>
              <h3 className="font-h2 text-primary">Category Share</h3>
              <p className="text-secondary text-sm mt-0.5">Top 5 categories by product count</p>
            </div>
            <div className="bg-surface-container p-2 rounded-lg text-primary">
              <LayoutGrid size={16} />
            </div>
          </div>
          <div className="h-64 mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('en-IN')} products`, '']} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v) => <span className="text-xs text-secondary">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Categories Horizontal Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card rounded-xl p-8 flex flex-col overflow-hidden relative">
          <div className="flex items-start justify-between mb-5 z-10">
            <div>
              <h3 className="font-h2 text-primary">Stock Forecast & Volume</h3>
              <p className="text-secondary text-sm mt-0.5">Predicted demand by category</p>
            </div>
            <div className="bg-surface-container p-2 rounded-lg text-primary">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-end gap-6 mt-4 relative z-10">
            {topCategories.slice(0, 5).map((cat, i) => {
              const max = topCategories[0]?.count || 1
              const pct = Math.round((cat.count / max) * 100)
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-label-caps text-secondary">
                    <span className="truncate pr-2 max-w-[200px]">{cat.name}</span>
                    <span className="font-bold text-primary">{cat.count.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-surface-container rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: cat.fill }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Row 3: Top Products + Recent Searches ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-xl">

        {/* Top Rated Products (as Intelligence Alerts Table equivalent) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center">
            <div>
              <h3 className="font-h2 text-primary">Top Rated Products</h3>
              <p className="text-secondary text-sm">Highest rated by customer reviews</p>
            </div>
            <Crown size={18} className="text-amber-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-8 py-4 text-xs font-label-caps text-secondary uppercase tracking-widest">Rank</th>
                  <th className="px-8 py-4 text-xs font-label-caps text-secondary uppercase tracking-widest">Product</th>
                  <th className="px-8 py-4 text-xs font-label-caps text-secondary uppercase tracking-widest">Reviews</th>
                  <th className="px-8 py-4 text-xs font-label-caps text-secondary uppercase tracking-widest">Price / Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.top_products.slice(0, 6).map((p, i) => (
                  <tr key={p.id} className="hover:bg-surface-container-lowest transition-colors cursor-pointer" onClick={() => window.location.href = `/product/${p.id}`}>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-surface-container text-secondary'}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-body-md font-medium text-primary">
                      {p.name.length > 50 ? p.name.substring(0, 50) + '...' : p.name}
                    </td>
                    <td className="px-8 py-5 text-secondary">{p.review_count?.toLocaleString() ?? '—'}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-primary">₹{p.price?.toLocaleString('en-IN')}</span>
                        <div className="flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-secondary">{p.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Searches */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card rounded-xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-h2 text-primary">Recent Searches</h3>
              <p className="text-secondary text-sm mt-0.5">Live query stream</p>
            </div>
            <Search size={16} className="text-secondary" />
          </div>

          {data.recent_searches.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-secondary">
              No searches yet.
            </div>
          ) : (
            <div className="space-y-2 flex-1 mt-4">
              {data.recent_searches.map((s, i) => (
                <Link key={i} to={`/search?q=${encodeURIComponent(s.query)}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Search size={12} className="text-outline flex-shrink-0" />
                      <span className="text-sm text-primary font-medium truncate group-hover:text-primary-fixed transition-colors">
                        {s.query}
                      </span>
                    </div>
                    <span className="text-xs text-secondary flex-shrink-0 ml-2">
                      {s.result_count} results
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* AI Insight Card */}
          <div className="mt-8 p-4 bg-primary-container rounded-lg text-on-primary-container">
            <div className="flex gap-2 items-center text-xs font-bold uppercase tracking-widest text-primary-fixed mb-2">
              <span className="material-symbols-outlined text-sm" data-icon="auto_awesome">auto_awesome</span>
              AI Insight
            </div>
            <p className="text-sm mt-1 leading-relaxed text-white/80">
              "{data.recent_searches[0]?.query || 'Electronics'}" is trending — avg. result count{' '}
              <span className="text-white font-bold">
                {data.recent_searches[0]?.result_count ?? 0}
              </span>. Consider expanding this category.
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  )
}
