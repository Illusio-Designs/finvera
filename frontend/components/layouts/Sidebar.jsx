import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Tooltip from '../ui/Tooltip';
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
      return <div className={`h-px bg-white/20 my-2 ${isCollapsed ? 'mx-2' : 'mx-4'}`} />;
    }

    if (item.children) {
      // Only check active/expanded state after mount to prevent hydration mismatch
      const isExpanded = mounted && (expandedItems[item.label] || false);
      const hasActiveChild = mounted && item.children.some(child => isActive(child.href));
      const isActiveState = mounted && (hasActiveChild || isExpanded);

      const buttonContent = (
        <button
          onClick={() => toggleExpand(item.label)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            isActiveState
              ? 'bg-white/20 text-white'
              : 'text-white hover:bg-white/10'
          } ${isCollapsed ? 'justify-center px-2' : ''}`}
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
      );

      return (
        <div>
          {isCollapsed ? (
            <Tooltip content={item.label} side="right" className="w-full">
              {buttonContent}
            </Tooltip>
          ) : (
            buttonContent
          )}
          {!isCollapsed && mounted && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child, childIndex) => {
                // Handle nested children (like vouchers dropdown)
                if (child.children) {
                  const childIsExpanded = mounted && (expandedItems[`${item.label}-${child.label}`] || false);
                  const hasActiveGrandChild = mounted && child.children.some(grandChild => isActive(grandChild.href));
                  const childIsActiveState = mounted && (hasActiveGrandChild || childIsExpanded);
                  
                  return (
                    <div key={child.href || child.label || childIndex}>
                      <button
                        onClick={() => toggleExpand(`${item.label}-${child.label}`)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          childIsActiveState
                            ? 'bg-white/20 text-white font-medium'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          {child.icon && (
                            <span className="mr-3 flex-shrink-0">
                              {typeof child.icon === 'function' ? <child.icon className="h-4 w-4" /> : child.icon}
                            </span>
                          )}
                          <span className="truncate">{child.label}</span>
                        </div>
                        <FiChevronRight className={`ml-2 flex-shrink-0 transition-transform ${childIsExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {childIsExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {child.children.map((grandChild) => {
                            const grandChildIsActive = isActive(grandChild.href);
                            return (
                              <Link
                                key={grandChild.href}
                                href={grandChild.href}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                                  grandChildIsActive
                                    ? 'bg-white/25 text-white font-medium'
                                    : 'text-white/70 hover:bg-white/10'
                                }`}
                              >
                                {grandChild.icon && (
                                  <span className="mr-3 flex-shrink-0">
                                    {typeof grandChild.icon === 'function' ? <grandChild.icon className="h-4 w-4" /> : grandChild.icon}
                                  </span>
                                )}
                                <span className="truncate">{grandChild.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Regular child item
                const childIsActive = isActive(child.href);
                return (
                  <Link
                    key={child.href || child.label || childIndex}
                    href={child.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      childIsActive
                        ? 'bg-white/20 text-white font-medium'
                        : 'text-white/80 hover:bg-white/10'
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
    
    const linkContent = (
      <Link
        href={item.href || '#'}
        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          linkIsActive
            ? 'bg-white/20 text-white'
            : 'text-white hover:bg-white/10'
        } ${isCollapsed ? 'justify-center px-2' : ''}`}
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

    return (
      <>
        {isCollapsed ? (
          <Tooltip content={item.label} side="right" className="w-full">
            {linkContent}
          </Tooltip>
        ) : (
          linkContent
        )}
      </>
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
          fixed z-50 shadow-sm transform transition-all duration-300 ease-in-out rounded-lg
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:fixed
          ${isCollapsed ? 'w-16' : 'w-64'}
          flex flex-col
          bg-[#243a75] text-white
          top-20 left-4 bottom-6
          h-[calc(100vh-6rem)]
          p-3
          overflow-visible
        `}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-end px-1 pb-3 border-b border-white/20 lg:hidden">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-white hover:bg-white/10 transition"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-1 py-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {items.map((item, index) => (
            <NavItem key={item.href || item.label || index} item={item} />
          ))}
        </nav>

        {/* Expand/Collapse Toggle - Sticky at bottom */}
        {onToggleCollapse && (
          <div className="border-t border-white/20 mt-auto">
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex w-full items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start px-3 py-3 gap-2'} rounded-lg text-white hover:bg-white/10 transition`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <FiChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <FiChevronLeft className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Collapse</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
