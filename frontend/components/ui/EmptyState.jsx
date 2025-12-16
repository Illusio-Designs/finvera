export default function EmptyState({
  title = 'No data found',
  description = 'There is no data to display at the moment.',
  action,
  icon,
  className = '',
}) {
  return (
    <div className={`text-center py-16 px-4 ${className}`}>
      {icon ? (
        <div className="mx-auto h-16 w-16 text-gray-300 mb-4 flex items-center justify-center">
          {icon}
        </div>
      ) : (
        <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

