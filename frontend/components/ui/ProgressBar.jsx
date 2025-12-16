export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = true,
  className = '',
}) {
  const pct = Math.max(0, Math.min(100, (Number(value) / Number(max || 100)) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) ? (
        <div className="flex items-center justify-between mb-1">
          {label ? <span className="text-sm font-medium text-gray-700">{label}</span> : <span />}
          {showValue ? <span className="text-sm text-gray-500">{Math.round(pct)}%</span> : null}
        </div>
      ) : null}
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-600 transition-all"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
