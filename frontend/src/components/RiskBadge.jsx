const STYLES = {
  'High Risk': 'badge-risk high',
  Suspicious: 'badge-risk warn',
  Safe: 'badge-risk safe',
};

export default function RiskBadge({ level }) {
  const cls = STYLES[level] || 'badge-risk muted';
  return <span className={cls}>{level || 'Unknown'}</span>;
}
