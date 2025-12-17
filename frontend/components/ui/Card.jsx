export default function Card({ children, title, actions, className = '', ...props }) {
  return (
    <div 
      className={`
        bg-white
        rounded-xl
        shadow-sm
        border
        border-gray-200
        transition-shadow
        duration-200
        hover:shadow-md
        w-full
        ${className}
      `.replace(/\s+/g, ' ').trim()} 
      {...props}
    >
      {(title || actions) && (
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between rounded-t-xl">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={`px-6 ${title || actions ? 'py-5' : 'py-6'}`}>
        {children}
      </div>
    </div>
  );
}

