export default function ScoreBadge({ score, decision }) {
  const kind = (decision === 'AUTO' || decision === 'MATCH_EXISTING') ? 'success' : decision === 'REVIEW' ? 'warning' : 'danger'
  return <span className={`score-badge ${kind}`}>{decision} · {(Number(score) * 100).toFixed(1)}%</span>
}
