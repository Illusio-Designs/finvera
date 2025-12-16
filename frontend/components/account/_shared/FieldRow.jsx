export default function FieldRow({ label, value, right, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-sm text-gray-900 break-words">{value}</div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
