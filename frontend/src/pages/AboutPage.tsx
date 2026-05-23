import { motion } from 'framer-motion'
import { Sparkles, Brain, Search, Camera, BarChart3, GitCompare, TrendingUp, Github, Shield, Zap, Database, Code2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay }
})

const FEATURES = [
  { icon: Brain,      title: 'Hybrid ML Search',         desc: 'A two-model TF-IDF system — name-focused + full-text — weighted and combined. Finds what you mean, not just what you typed.',        color: 'text-accent bg-gray-100 border-gray-300' },
  { icon: Camera,     title: 'Live Camera Recognition',   desc: 'Point your camera at any product. Our visual pipeline grabs a frame, analyzes it, and returns the closest matching products instantly.',  color: 'text-amber bg-amber/10 border-amber/20' },
  { icon: TrendingUp, title: 'Prophet Price Forecasting', desc: "Facebook's Prophet model generates 30-day price forecasts with confidence bands, so you know whether to buy now or wait.",               color: 'text-emerald bg-emerald/10 border-emerald/20' },
  { icon: Sparkles,   title: 'Sentiment Analysis',        desc: 'Every product gets a sentiment score derived from review text and ratings — positive, neutral, or negative — at a glance.',              color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { icon: GitCompare, title: 'Side-by-Side Comparison',   desc: 'Add up to 3 products and instantly compare price, ratings, discounts, and specs. Best value is highlighted automatically.',               color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
  { icon: BarChart3,  title: 'Analytics Dashboard',       desc: 'Live stats on 1,337 products — category breakdowns, price distributions, top products, and recent search trends.',                        color: 'text-rose bg-rose/10 border-rose/20' },
]

const STACK = [
  { icon: Code2,     label: 'React 18 + TypeScript',    note: 'Typed, component-driven frontend' },
  { icon: Zap,       label: 'Vite + Tailwind CSS',       note: 'Instant HMR, utility-first styling' },
  { icon: Database,  label: 'Flask + SQLAlchemy',        note: 'Python backend, SQLite → PostgreSQL' },
  { icon: Brain,     label: 'Scikit-learn + Prophet',    note: 'TF-IDF search, price forecasting' },
  { icon: Shield,    label: 'No ads. No tracking.',      note: 'Your searches stay private' },
]

const TEAM_STATS = [
  { val: '1,337', label: 'Products indexed' },
  { val: '5',     label: 'ML models' },
  { val: '9',     label: 'Categories' },
  { val: '100%',  label: 'Open source' },
]

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-32 pb-24 text-center px-4">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div {...fadeUp(0)}>
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={12} />
            Built with ML · Trained on real data
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            About <span className="text-accent">RetailMind</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            An AI-powered retail intelligence platform that helps you search, identify, compare and understand products — using real machine learning models trained on real data.
          </p>
        </motion.div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 mb-20">
        <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TEAM_STATS.map(({ val, label }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="font-display text-3xl font-bold text-accent">{val}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── WHAT MAKES US DIFFERENT ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 mb-24">
        <motion.div {...fadeUp(0)} className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Why RetailMind is different</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Most product tools are just search boxes. RetailMind is an intelligence layer — it explains, predicts, and compares.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div key={title} {...fadeUp(i * 0.07)}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-card border border-border hover:border-white/10 rounded-3xl p-7 transition-colors"
            >
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${color}`}>
                <Icon size={22} />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-3">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 mb-24">
        <motion.div {...fadeUp(0)} className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-white mb-4">How it works</h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 top-8 bottom-8 w-px bg-border hidden md:block" />

          {[
            { step: '01', title: 'Data ingestion',     desc: '1,337 Amazon products are loaded, cleaned, and stored in SQLite. Each product has name, category, price, rating, description, and reviews.' },
            { step: '02', title: 'ML model training',  desc: 'A hybrid TF-IDF model is trained on product names and descriptions. A separate recommendation model embeds products using cosine similarity.' },
            { step: '03', title: 'Search & rank',      desc: "Your query is vectorized and matched against both models. The weighted hybrid score puts name matches first — so 'hdmi cable' finds HDMI cables." },
            { step: '04', title: 'Insights generation', desc: 'Prophet forecasts 30 days of price movement. Sentiment is derived from ratings. Category benchmarks are computed on the fly from the database.' },
            { step: '05', title: 'Camera recognition', desc: 'A live camera frame is sent as base64 to the backend. FAISS visual similarity finds matches; a heuristic classifier works as fallback.' },
          ].map(({ step, title, desc }, i) => (
            <motion.div key={step} {...fadeUp(i * 0.1)}
              className="relative flex gap-6 mb-8 last:mb-0"
            >
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center z-10">
                <span className="font-display text-xs font-bold text-accent">{step}</span>
              </div>
              <div className="flex-1 bg-card border border-border rounded-2xl p-5 md:ml-2">
                <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── TECH STACK ────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 mb-24">
        <motion.div {...fadeUp(0)} className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Tech Stack</h2>
          <p className="text-gray-500 text-sm">No bloated dependencies. Every tool chosen for a reason.</p>
        </motion.div>
        <div className="space-y-3">
          {STACK.map(({ icon: Icon, label, note }, i) => (
            <motion.div key={label} {...fadeUp(i * 0.08)}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{note}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="max-w-2xl mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-3xl p-12">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={28} className="text-accent" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">Start exploring</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Search 1,337 products with ML-powered ranking, compare prices, and get forecasts — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/search">
              <motion.button whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-xl font-medium transition-colors">
                <Search size={16} /> Search Products
              </motion.button>
            </Link>
            <Link to="/analytics">
              <motion.button whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-surface border border-border hover:border-accent/40 text-gray-300 hover:text-white px-8 py-3 rounded-xl font-medium transition-all">
                <BarChart3 size={16} /> View Analytics
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
