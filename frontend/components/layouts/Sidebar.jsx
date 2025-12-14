import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome, FiChevronRight, FiChevronLeft, FiMenu, FiX,
  FiUsers, FiBriefcase, FiTarget, FiDollarSign, FiCreditCard,
  FiGift, FiTag, FiSettings, FiUser, FiLogOut
} from 'react-icons/fi';

export default function Sidebar({ items = [], isOpen = true, onClose, isCollapsed, onToggleCollapse }) {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href) => {
    if (!href || !mounted) return false;
    if (href === '/') return router.pathname === href;
    return router.pathname.startsWith(href);
  };

  const toggleExpand = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const NavItem = ({ item, level = 0 }) => {
    if (item.divider) {
      return <div className={`h-px bg-gray-200 my-2 ${isCollapsed ? 'mx-2' : 'mx-4'}`} />;
    }

    if (item.children) {
      // Only check active/expanded state after mount to prevent hydration mismatch
      const isExpanded = mounted && (expandedItems[item.label] || false);
      const hasActiveChild = mounted && item.children.some(child => isActive(child.href));
      const isActiveState = mounted && (hasActiveChild || isExpanded);

      return (
        <div>
          <button
            onClick={() => toggleExpand(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              isActiveState
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <div className="flex items-center min-w-0">
              {item.icon && (
                <span className={`${isCollapsed ? '' : 'mr-3'} flex-shrink-0`}>
                  {typeof item.icon === 'function' ? <item.icon className="h-4 w-4" /> : item.icon}
                </span>
              )}
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </div>
            {!isCollapsed && (
              <FiChevronRight className={`ml-2 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            )}
          </button>
          {!isCollapsed && mounted && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => {
                const childIsActive = isActive(child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      childIsActive
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {child.icon && (
                      <span className="mr-3 flex-shrink-0">
                        {typeof child.icon === 'function' ? <child.icon className="h-4 w-4" /> : child.icon}
                      </span>
                    )}
                    <span className="truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Only check active state after mount to prevent hydration mismatch
    const linkIsActive = mounted && isActive(item.href);
    
    return (
      <Link
        href={item.href || '#'}
        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          linkIsActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        } ${isCollapsed ? 'justify-center px-2' : ''}`}
        title={isCollapsed ? item.label : ''}
        suppressHydrationWarning
      >
        {item.icon && (
          <span className={`${isCollapsed ? '' : 'mr-3'} flex-shrink-0`}>
            {typeof item.icon === 'function' ? <item.icon className="h-4 w-4" /> : item.icon}
          </span>
        )}
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          ${isCollapsed ? 'w-16' : 'w-64'}
          flex flex-col
        `}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!isCollapsed && (
            <Link href="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Finvera" 
                className="h-8 w-auto"
              />
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="flex items-center justify-center w-full">
              <img 
                src="/logo.png" 
                alt="Finvera" 
                className="h-8 w-auto"
              />
            </Link>
          )}
          <div className="flex items-center gap-2">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <FiChevronRight className="h-4 w-4" /> : <FiChevronLeft className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {items.map((item, index) => (
            <NavItem key={item.href || item.label || index} item={item} />
          ))}
        </nav>
      </aside>
    </>
  );
}
