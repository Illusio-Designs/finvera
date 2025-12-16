import Link from 'next/link';
import { FiChevronRight, FiHome } from 'react-icons/fi';

export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <FiChevronRight className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" />
            )}
            {index === 0 && item.label === 'Admin' && (
              <FiHome className="h-4 w-4 text-gray-400 mr-1.5" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={`
                  text-sm font-medium transition-colors
                  ${index === items.length - 1
                    ? 'text-gray-500 cursor-default'
                    : 'text-gray-600 hover:text-primary-600'
                  }
                `}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`
                  text-sm font-semibold
                  ${index === items.length - 1
                    ? 'text-gray-900'
                    : 'text-gray-600'
                  }
                `}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

