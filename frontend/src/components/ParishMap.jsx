/**
 * ParishMap.jsx — Louisiana parish-level choropleth map.
 *
 * Props:
 *   data:           Array of { parish, value, label }
 *   colorMetric:    'sps' | 'demand' | 'risk'
 *   onParishClick:  (parishName) => void
 *   title:          string
 *   isDark:         bool
 */

import { useState, useEffect, useMemo } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { MapPin } from 'lucide-react'

const GEO_URL = '/louisiana-parishes.json'

// Color scales per metric
const COLOR_CONFIGS = {
  sps: {
    low:  '#5dd6cc',  // light teal — low SPS (needs help)
    high: '#0A2342',  // dark navy — high SPS (doing well)
    label: 'SPS Score',
    min: 60, max: 120,
  },
  demand: {
    low:  '#5dd6cc',
    high: '#0A2342',
    label: 'Demand Score',
    min: 0, max: 100,
  },
  risk: {
    low:  '#0A2342',  // navy — low risk
    high: '#EF4444',  // red — high risk
    label: 'Risk Score',
    min: 0, max: 1,
  },
}

function interpolateColor(low, high, t) {
  const hex = (h) => [
    parseInt(h.slice(1,3), 16),
    parseInt(h.slice(3,5), 16),
    parseInt(h.slice(5,7), 16),
  ]
  const [r1,g1,b1] = hex(low)
  const [r2,g2,b2] = hex(high)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

// Fallback grid when GeoJSON fails to load
function FallbackGrid({ data, colorMetric, onParishClick, isDark }) {
  const cfg    = COLOR_CONFIGS[colorMetric] || COLOR_CONFIGS.sps
  const values = data.map(d => d.value).filter(Boolean)
  const minV   = values.length ? Math.min(...values) : cfg.min
  const maxV   = values.length ? Math.max(...values) : cfg.max

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  return (
    <div className="space-y-3">
      <p className={`text-xs ${muted}`}>Map view unavailable — showing parish grid</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
        {data.map(d => {
          const t     = maxV > minV ? (d.value - minV) / (maxV - minV) : 0.5
          const color = interpolateColor(cfg.low, cfg.high, Math.max(0, Math.min(1, t)))
          return (
            <button
              key={d.parish}
              onClick={() => onParishClick?.(d.parish)}
              title={`${d.parish}: ${d.value}`}
              style={{ backgroundColor: color }}
              className="rounded-lg p-2 text-left transition-transform hover:scale-105 cursor-pointer"
            >
              <p className="text-white text-[9px] font-semibold leading-tight truncate">{d.parish}</p>
              <p className="text-white/80 text-[10px] font-mono">{d.value}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ParishMap({ data = [], colorMetric = 'sps', onParishClick, title = '', isDark = false }) {
  const [tooltip, setTooltip]     = useState(null)
  const [geoError, setGeoError]   = useState(false)
  const [selected, setSelected]   = useState(null)

  const cfg    = COLOR_CONFIGS[colorMetric] || COLOR_CONFIGS.sps
  const values = data.map(d => d.value).filter(v => v !== null && v !== undefined)
  const minV   = values.length ? Math.min(...values) : cfg.min
  const maxV   = values.length ? Math.max(...values) : cfg.max

  // Build a lookup map: parish name → value
  const parishLookup = useMemo(() => {
    const map = {}
    data.forEach(d => { map[d.parish?.toLowerCase()] = d })
    return map
  }, [data])

  function getParishData(geoName) {
    if (!geoName) return null
    const key = geoName.toLowerCase().replace(' parish', '').trim()
    return parishLookup[key] || parishLookup[geoName.toLowerCase()] || null
  }

  function getFillColor(geoName) {
    const parish = getParishData(geoName)
    if (!parish || parish.value === null || parish.value === undefined) {
      return isDark ? '#1a3a5c' : '#e2e8f0'
    }
    const t = maxV > minV ? (parish.value - minV) / (maxV - minV) : 0.5
    return interpolateColor(cfg.low, cfg.high, Math.max(0, Math.min(1, t)))
  }

  function handleClick(geoName) {
    const parish = getParishData(geoName)
    const name   = parish?.parish || geoName
    setSelected(name)
    onParishClick?.(name)
  }

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-navy-2 border-white/8' : 'bg-white border-navy/8 shadow-card'}`}>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={14} className="text-teal-2" />
          <p className={`text-sm font-medium ${text}`}>{title}</p>
        </div>
      )}

      {geoError ? (
        <FallbackGrid data={data} colorMetric={colorMetric} onParishClick={onParishClick} isDark={isDark} />
      ) : (
        <div className="relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 3800, center: [-92.0, 31.15] }}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL} onError={() => setGeoError(true)}>
              {({ geographies }) =>
                  geographies.map(geo => {
                    const geoName = geo.properties.NAME || geo.properties.name || geo.properties.COUNTY || ''
                    const fill    = getFillColor(geoName)
                    const parish  = getParishData(geoName)
                    const isSelected = selected && (parish?.parish === selected || geoName === selected)

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)'}
                        strokeWidth={isSelected ? 2.5 : 0.8}
                        style={{
                          default:  { outline: 'none', cursor: 'pointer' },
                          hover:    { outline: 'none', opacity: 0.85, cursor: 'pointer' },
                          pressed:  { outline: 'none' },
                        }}
                        onMouseEnter={(e) => {
                          const val = parish?.value
                          setTooltip({
                            x: e.clientX,
                            y: e.clientY,
                            name:  parish?.parish || geoName,
                            value: val !== null && val !== undefined ? val : 'N/A',
                            label: parish?.label || cfg.label,
                          })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => handleClick(geoName)}
                      />
                    )
                  })
                }
            </Geographies>
          </ComposableMap>

          {/* Tooltip */}
          {tooltip && (
            <div
              className={`fixed z-50 pointer-events-none px-3 py-2 rounded-lg border text-xs shadow-lg
                ${isDark ? 'bg-navy border-white/10 text-white' : 'bg-white border-navy/10 text-navy shadow-md'}`}
              style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
            >
              <p className="font-semibold">{tooltip.name} Parish</p>
              <p className={muted}>{tooltip.label}: <strong className={text}>{tooltip.value}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3">
        <p className={`text-[10px] font-mono ${muted}`}>{minV}</p>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{
          background: `linear-gradient(to right, ${cfg.low}, ${cfg.high})`,
        }} />
        <p className={`text-[10px] font-mono ${muted}`}>{maxV}</p>
        <p className={`text-[10px] ${muted} ml-1`}>{cfg.label}</p>
      </div>
      {selected && (
        <p className={`text-[10px] mt-1 ${muted}`}>
          Selected: <span className="font-semibold text-teal-2">{selected}</span>
          <button onClick={() => { setSelected(null); onParishClick?.(null) }}
            className="ml-2 underline cursor-pointer">clear</button>
        </p>
      )}
    </div>
  )
}
