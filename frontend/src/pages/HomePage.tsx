import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraSearch from '../components/CameraSearch'
import type { Product } from '../types/productTypes'

export default function HomePage() {
  const navigate = useNavigate()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleCameraResults = (products: Product[], capturedImage?: string) => {
    setCameraOpen(false)
    if (products.length > 0) {
      navigate(`/product/${products[0].id}`, { state: { capturedImage } })
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md selection:bg-primary/10">
      <main>
        {/* Hero Section */}
        <section className="relative pt-xl pb-lg overflow-hidden premium-gradient">
          <div className="max-w-container_max mx-auto px-gutter text-center relative z-10">
            <span className="font-label-caps text-primary tracking-widest bg-primary-container/10 px-sm py-1 rounded-full border border-primary/5 mb-md inline-block">PRECISION INTELLIGENCE</span>
            <h1 className="font-display text-display text-primary max-w-4xl mx-auto mb-sm">Master the Marketplace with <span className="text-secondary">AI-Driven Retail Clarity.</span></h1>
            <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto mb-lg">Unified visual search and predictive analytics for elite retail performance across Amazon, Flipkart, and Myntra.</p>
            
            {/* AI Search Bar */}
            <div className="max-w-3xl mx-auto glass-card rounded-2xl p-sm mb-xl">
              <form onSubmit={handleSearch} className="flex items-center gap-sm bg-surface-container-lowest rounded-xl px-md py-xs shadow-inner">
                <span className="material-symbols-outlined text-outline">search</span>
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md py-4" 
                  placeholder="Search by product link or describe your vision..." 
                  type="text"
                />
                <div className="flex items-center gap-xs">
                  <button 
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    className="p-2 text-secondary hover:bg-surface-container rounded-lg transition-all" 
                    title="Upload Image"
                  >
                    <span className="material-symbols-outlined">image</span>
                  </button>
                  <button 
                    type="submit"
                    className="bg-primary text-on-primary px-lg py-3 rounded-lg font-bold flex items-center gap-xs hover:shadow-lg transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    Analyze
                  </button>
                </div>
              </form>
            </div>
            
            {/* Live Trends Ticker */}
            <div className="glass-card rounded-full py-3 overflow-hidden max-w-5xl mx-auto border-white/40">
              <div className="ticker-scroll flex items-center">
                <div className="flex items-center gap-lg px-lg border-r border-outline-variant/30">
                  <span className="font-label-caps text-secondary whitespace-nowrap">LIVE TRENDS:</span>
                  <span className="flex items-center gap-base text-body-md font-medium text-primary whitespace-nowrap"><span className="text-green-600">↑ 12%</span> Velvet Blazers</span>
                  <span className="flex items-center gap-base text-body-md font-medium text-primary whitespace-nowrap"><span className="text-green-600">↑ 8%</span> Sustainable Denim</span>
                  <span className="flex items-center gap-base text-body-md font-medium text-primary whitespace-nowrap"><span className="text-red-600">↓ 4%</span> Tech Accessories</span>
                  <span className="flex items-center gap-base text-body-md font-medium text-primary whitespace-nowrap"><span className="text-green-600">↑ 22%</span> Smart Watches</span>
                </div>
                {/* Duplicate for seamless scroll */}
                <div className="flex items-center gap-lg px-lg">
                  <span className="font-label-caps text-secondary whitespace-nowrap">LIVE TRENDS:</span>
                  <span className="flex items-center gap-base text-body-md font-medium text-primary whitespace-nowrap"><span className="text-green-600">↑ 12%</span> Velvet Blazers</span>
                  <span className="flex items-center gap-base text-body-md font-medium text-primary whitespace-nowrap"><span className="text-green-600">↑ 8%</span> Sustainable Denim</span>
                  <span className="flex items-center gap-base text-body-md font-medium text-primary whitespace-nowrap"><span className="text-red-600">↓ 4%</span> Tech Accessories</span>
                  <span className="flex items-center gap-base text-body-md font-medium text-primary whitespace-nowrap"><span className="text-green-600">↑ 22%</span> Smart Watches</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-secondary-fixed rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-tertiary-fixed rounded-full blur-[120px]"></div>
          </div>
        </section>
        
        {/* Value Props Grid */}
        <section className="py-xl bg-surface">
          <div className="max-w-container_max mx-auto px-gutter">
            <div className="text-center mb-xl">
              <h2 className="font-display text-h1 text-primary mb-sm">The Precision Suite</h2>
              <p className="font-body-md text-body-md text-secondary max-w-xl mx-auto">Every tool needed to dominate high-end retail markets with automated intelligence.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
              {/* Multi-store Comparison */}
              <div className="md:col-span-8 group">
                <div className="glass-card rounded-2xl p-lg h-full hover:border-primary/20 transition-all cursor-default overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="bg-primary/5 w-12 h-12 rounded-xl flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-primary">compare_arrows</span>
                    </div>
                    <h3 className="font-h2 text-h2 text-primary mb-sm">Omni-Channel Comparison</h3>
                    <p className="text-secondary max-w-md mb-lg">Real-time mapping of your products across Amazon, Flipkart, and Myntra. Spot pricing gaps and inventory mismatches instantly.</p>
                    <div className="flex gap-sm">
                      <div className="bg-white/50 px-md py-sm rounded-lg border border-outline-variant/30 flex items-center gap-xs">
                        <span className="font-bold text-primary">Amazon</span>
                        <span className="text-xs text-green-600 font-bold">Optimized</span>
                      </div>
                      <div className="bg-white/50 px-md py-sm rounded-lg border border-outline-variant/30 flex items-center gap-xs">
                        <span className="font-bold text-primary">Myntra</span>
                        <span className="text-xs text-red-500 font-bold">Adjust Price</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute right-[-40px] bottom-[-40px] opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-[320px]">monitoring</span>
                  </div>
                </div>
              </div>
              
              {/* AI Predictions */}
              <div className="md:col-span-4 group">
                <div className="glass-card rounded-2xl p-lg h-full border-primary/5 hover:border-primary/20 transition-all">
                  <div className="bg-primary/5 w-12 h-12 rounded-xl flex items-center justify-center mb-md group-hover:rotate-12 transition-transform">
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  </div>
                  <h3 className="font-h3 text-h3 text-primary mb-sm">AI Stock Predictions</h3>
                  <p className="text-secondary mb-md text-body-md">Advanced ML models that forecast demand fluctuations up to 90 days in advance with 94% accuracy.</p>
                  <div className="mt-auto pt-md">
                    <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[75%] rounded-full"></div>
                    </div>
                    <div className="flex justify-between mt-xs font-label-caps text-secondary">
                      <span>Inventory Risk</span>
                      <span className="text-primary">Low</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Analytics Bento Item */}
              <div className="md:col-span-4 group">
                <div className="glass-card rounded-2xl p-lg h-full hover:border-primary/20 transition-all">
                  <div className="bg-primary/5 w-12 h-12 rounded-xl flex items-center justify-center mb-md">
                    <span className="material-symbols-outlined text-primary">query_stats</span>
                  </div>
                  <h3 className="font-h3 text-h3 text-primary mb-sm">Deep Market Pulse</h3>
                  <p className="text-secondary mb-md text-body-md">Analyze consumer sentiment and competitor velocity using real-time social and search signals.</p>
                </div>
              </div>
              
              {/* Visual Intelligence Bento Item */}
              <div className="md:col-span-8 group overflow-hidden">
                <div className="bg-primary text-on-primary rounded-2xl p-lg h-full flex flex-col md:flex-row gap-lg items-center relative">
                  <div className="flex-1">
                    <h3 className="font-h2 text-h2 mb-sm">Visual Brand Integrity</h3>
                    <p className="text-on-primary-container text-body-md mb-lg">Automated visual audits ensure your brand imagery is consistent and premium across all touchpoints.</p>
                    <button className="border border-on-primary/20 hover:bg-on-primary/10 px-md py-sm rounded-lg font-body-md transition-all">Launch Visual Audit</button>
                  </div>
                  <div className="w-full md:w-1/2 rounded-xl overflow-hidden shadow-2xl relative h-48 md:h-full min-h-[200px]">
                    <img className="absolute inset-0 w-full h-full object-cover" alt="Visual Audit" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0jo49IIo1YCP4MnaAAn7by4wcamr-meF7fSn7oNpPseqYMWBlx-McyvDkvPYW5atZC--fSmpXxMSlXoWHftV-n75ldLbtVW_24wI3Is6kWem870FbR_MfmIs1TOfMw3EQKePnxu7etWV_K7dO4NBwvcQSwBjdAC3UAy92OfkMpx4aYS80yc52QMYCbPWi1Z3UH4HvvKLMtYgouKHQeibLitUxw0z_3LuworftB6dAOrD4yyY0v2tjZ3SUtgexoIzB2bxaPXu6SNw"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Intelligence Showcase */}
        <section className="py-xl">
          <div className="max-w-container_max mx-auto px-gutter grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
            <div>
              <span className="font-label-caps text-secondary mb-sm block">THE AI ADVANTAGE</span>
              <h2 className="font-display text-h1 text-primary mb-md">Stop Guessing. <br/>Start Orchestrating.</h2>
              <ul className="space-y-sm mb-lg">
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-green-600 bg-green-50 rounded-full p-1 text-[18px]">check</span>
                  <p className="text-body-md text-secondary"><strong className="text-primary">Automated Catalog Sync:</strong> Instant updates across all SKUs and store profiles.</p>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-green-600 bg-green-50 rounded-full p-1 text-[18px]">check</span>
                  <p className="text-body-md text-secondary"><strong className="text-primary">Competitor Tracking:</strong> Get alerted the moment a rival changes their promotion strategy.</p>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-green-600 bg-green-50 rounded-full p-1 text-[18px]">check</span>
                  <p className="text-body-md text-secondary"><strong className="text-primary">Visual Search Engine:</strong> Search your internal assets with image-to-data mapping.</p>
                </li>
              </ul>
              <button onClick={() => navigate('/analytics')} className="bg-primary text-on-primary px-lg py-4 rounded-xl font-bold hover:shadow-xl transition-all">Explore Analytics Dashboard</button>
            </div>
            <div className="glass-card rounded-3xl p-md">
              <div className="bg-surface-container rounded-2xl aspect-video relative overflow-hidden group">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Dashboard Preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCL9qq0Gn4wOvFIMmPsO5u4An7outXUA1I13DQXIvdirAF6TXdArk_MeRVgy0Yv3Lt0T4o2-uV4rybUuWklEGypGb3IzHnjnbaEG2PcdqDW3qSsIU1dOxhphOK3K5PX6OwpVMAKEn012G5iJqWy_Daw-oKPc1IULu-DrQp3dbdvsWYGiMqx4Ah2eyfaBmtHwBwcWGp4vA0j4jE3pg5YQBi2pxmr-5E18L9SsfNMCpPTt1SWRb_CtELOT9OEqzW9CIfHKW_MW2SZpvE"/>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
                <div className="absolute bottom-md left-md">
                  <div className="glass-card rounded-lg px-md py-xs text-xs font-bold text-primary flex items-center gap-xs">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live Analytics Sync
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Camera modal */}
      {cameraOpen && (
        <CameraSearch onResults={handleCameraResults} onClose={() => setCameraOpen(false)} />
      )}
    </div>
  )
}
