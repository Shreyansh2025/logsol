import Icon from './Icon'
export default function MetricCard({ label, value, hint, icon, tone = '' }) {
  return <div className={`metric-card ${tone}`}>
    <div className="metric-top"><div className="metric-icon"><Icon name={icon} size={17}/></div><span>{label}</span></div>
    <div className="metric-value">{value}</div>
    <div className="metric-hint">{hint}</div>
  </div>
}
