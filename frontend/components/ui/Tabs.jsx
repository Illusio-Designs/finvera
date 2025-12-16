export default function Tabs({
  tabs = [],
  active,
  onChange,
  className = '',
}) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex flex-wrap gap-6" aria-label="Tabs">
        {tabs.map((t) => {
          const isActive = active === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange?.(t.value)}
              className={
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors " +
                (isActive
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
              }
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
