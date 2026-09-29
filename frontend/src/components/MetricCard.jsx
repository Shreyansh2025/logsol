import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

function useCountUp(value, duration = 1100) {
  const numeric = Number(String(value).replace(/[^0-9.-]/g, '')) || 0
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const from = prev.current
    const to = numeric
    const start = performance.now()
    let frame

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (to - from) * eased)
      if (p < 1) frame = requestAnimationFrame(tick)
      else prev.current = to
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [numeric, duration])

  return Math.round(display)
}

export default function MetricCard({ label, value, hint, icon, tone = '', trend, trendType = 'positive' }) {
  const numeric = useCountUp(value)
  const isNumeric = /^[-+]?\d[\d,]*(?:\.\d+)?$/.test(String(value).replace(/,/g, ''))
  const shown = isNumeric ? numeric.toLocaleString() : value

  return (
    <div className={`metric-card metric-card-enhanced ${tone}`}>
      <div className="metric-top">
        <div className="metric-icon"><Icon name={icon} size={17}/></div>
        <span>{label}</span>
        {trend && <span className={`metric-trend ${trendType}`}>{trend}</span>}
      </div>
      <div className="metric-value metric-number-roll" aria-label={`${label}: ${value}`}>{shown}</div>
      <div className="metric-hint">{hint}</div>
      <div className="metric-sparkline" aria-hidden="true">
        <span/><span/><span/><span/><span/><span/><span/>
      </div>
    </div>
  )
}
