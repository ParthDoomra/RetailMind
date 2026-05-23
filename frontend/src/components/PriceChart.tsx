/**
 * PriceChart — Historical price + ML forecast chart.
 * Uses Recharts AreaChart with real backend data.
 */
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts'
import type { PriceForecast } from '../types/productTypes'

interface Props { forecast: PriceForecast }

// Custom tooltip with nice styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const dt = new Date(label)
  const dateStr = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-500 mb-2">{dateStr}</p>
      {payload.map((entry: any) => {
        if (!entry.value) return null
        const isHistory  = entry.dataKey === 'actual'
        const isForecast = entry.dataKey === 'forecast'
        if (!isHistory && !isForecast) return null
        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: entry.stroke || entry.fill }} />
              <span className="text-gray-500">{isHistory ? 'Historical' : 'Forecast'}</span>
            </span>
            <span className="font-bold text-gray-800">₹{Number(entry.value).toLocaleString('en-IN')}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function PriceChart({ forecast }: Props) {
  // Use full 180-day history (not sliced to 60)
  const historyData = forecast.history.map(d => ({
    date:     d.date,
    actual:   d.price,
    forecast: null as number | null,
    lower:    null as number | null,
    upper:    null as number | null,
  }))

  const forecastData = forecast.forecast.map(d => ({
    date:     d.date,
    actual:   null as number | null,
    forecast: d.price,
    lower:    d.lower,
    upper:    d.upper,
  }))

  // Connect last history point to first forecast point for visual continuity
  if (historyData.length && forecastData.length) {
    const lastActual = historyData[historyData.length - 1].actual
    forecastData[0] = { ...forecastData[0], actual: lastActual }
  }

  const combined = [...historyData, ...forecastData]

  // Show one label per ~30 days to avoid clutter
  const labelEvery = Math.ceil(combined.length / 7)
  const formatDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.toLocaleString('default', { month: 'short' })} ${dt.getDate()}`
  }

  // The last history date is the "Today" divider
  const todayDate = historyData.length > 0 ? historyData[historyData.length - 1].date : null

  // Compute price range for Y-axis domain padding
  const allPrices = combined.flatMap(d => [d.actual, d.forecast, d.upper].filter(Boolean) as number[])
  const minP = allPrices.length ? Math.min(...allPrices) : 0
  const maxP = allPrices.length ? Math.max(...allPrices) : 1000
  const pad  = (maxP - minP) * 0.1
  const yMin = Math.max(0, Math.floor(minP - pad))
  const yMax = Math.ceil(maxP + pad)

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combined} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0f172a" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
              tickFormatter={(v, i) => (i % labelEvery === 0 ? formatDate(v) : '')}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
              tickFormatter={v => `₹${Number(v).toLocaleString('en-IN')}`}
              axisLine={false}
              tickLine={false}
              width={80}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* "Today" vertical reference line */}
            {todayDate && (
              <ReferenceLine
                x={todayDate}
                stroke="#64748b"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{ value: 'Today', fill: '#64748b', fontSize: 10, fontWeight: 600, position: 'insideTopRight', dy: -4 }}
              />
            )}

            {/* Confidence band (upper/lower bounds) */}
            <Area dataKey="upper" stroke="none" fill="url(#bandGrad)" fillOpacity={1} legendType="none" />
            <Area dataKey="lower" stroke="none" fill="#ffffff"         fillOpacity={1} legendType="none" />

            {/* Historical price line */}
            <Area
              dataKey="actual"
              type="monotone"
              stroke="#0f172a"
              strokeWidth={2}
              fill="url(#actualGrad)"
              dot={false}
              connectNulls
              activeDot={{ r: 4, fill: '#0f172a', strokeWidth: 0 }}
            />

            {/* Forecast line */}
            <Area
              dataKey="forecast"
              type="monotone"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#forecastGrad)"
              dot={false}
              connectNulls
              strokeDasharray="6 3"
              activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-6 h-[2px] rounded bg-gray-900" />
          Historical price
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-6 h-[2px] rounded bg-amber-400 border-dashed" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#f59e0b 0 5px,transparent 5px 8px)' }} />
          Forecast ({forecast.method === 'prophet' ? 'Prophet ML' : 'Linear'})
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-4 h-3 rounded bg-amber-100 border border-amber-200" />
          Confidence band
        </div>
      </div>
    </div>
  )
}
