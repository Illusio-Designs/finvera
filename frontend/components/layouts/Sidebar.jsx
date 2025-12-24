import { useState, useEffect, useRef } from 'react';
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
  const [collapsedDropdown, setCollapsedDropdown] = useState(null);
  const dropdownRefs = useRef({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close collapsed dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!collapsedDropdown) return;
      
      const dropdownElement = dropdownRefs.current[collapsedDropdown];
      if (!dropdownElement) return;

      // Check if click is outside both the dropdown and the sidebar
      const sidebar = event.target.closest('aside');
      const isClickInDropdown = dropdownElement.contains(event.target);
      const isClickInSidebar = sidebar !== null;
      
      // Only close if clicking completely outside both dropdown and sidebar
      if (!isClickInDropdown && !isClickInSidebar) {
        setCollapsedDropdown(null);
      }
    }

    if (collapsedDropdown) {
      // Use a small delay to prevent immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [collapsedDropdown]);

  const isActive = (href) => {
    if (!href || !mounted) return false;
    if (href === '/') return router.pathname === href;
    return router.pathname.startsWith(href);
  };

  const toggleExpand = (key) => {
    if (isCollapsed) {
      // When collapsed, show dropdown menu instead of expanding inline
      setCollapsedDropdown(collapsedDropdown === key ? null : key);
    } else {
      setExpandedItems(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
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
      const isDropdownOpen = isCollapsed && collapsedDropdown === item.label;

      const buttonContent = (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(item.label);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-normal ${
            isActiveState || isDropdownOpen
              ? 'bg-white/20 text-white'
              : 'text-white hover:bg-white/10'
          } ${isCollapsed ? 'justify-center px-2' : ''}`}
          title={isCollapsed ? item.label : undefined}
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

      // Render collapsed dropdown menu
      const renderCollapsedDropdown = () => {
        if (!isCollapsed || collapsedDropdown !== item.label) return null;

        return (
          <div
            ref={(el) => {
              if (el) {
                dropdownRefs.current[item.label] = el;
              }
            }}
            className="absolute left-full ml-2 top-0 z-[100] min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-2xl"
            style={{ 
              maxHeight: 'calc(100vh - 120px)', 
              overflowY: 'auto',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'absolute'
            }}
            onClick={(e) => {
              // Prevent click from bubbling up and closing the dropdown
              e.stopPropagation();
            }}
          >
            <div className="py-1">
              {item.children.map((child, childIndex) => {
                // Handle nested children
                if (child.children) {
                  const childIsExpanded = mounted && (expandedItems[`${item.label}-${child.label}`] || false);
                  const hasActiveGrandChild = mounted && child.children.some(grandChild => isActive(grandChild.href));
                  
                  return (
                    <div key={child.href || child.label || childIndex}>
                      <button
                        onClick={() => {
                          if (isCollapsed) {
                            setExpandedItems(prev => ({
                              ...prev,
                              [`${item.label}-${child.label}`]: !prev[`${item.label}-${child.label}`]
                            }));
                          } else {
                            toggleExpand(`${item.label}-${child.label}`);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                          hasActiveGrandChild
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
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
                        <div className="ml-4 space-y-0.5">
                          {child.children.map((grandChild) => {
                            const grandChildIsActive = isActive(grandChild.href);
                            return (
                              <Link
                                key={grandChild.href}
                                href={grandChild.href}
                                onClick={() => setCollapsedDropdown(null)}
                                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                                  grandChildIsActive
                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
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
                    onClick={() => setCollapsedDropdown(null)}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      childIsActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
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
          </div>
        );
      };

      return (
        <div 
          className="relative" 
          style={{ 
            zIndex: collapsedDropdown === item.label ? 100 : 'auto',
            position: 'relative'
          }}
        >
          {buttonContent}
          {isCollapsed && renderCollapsedDropdown()}
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
                            ? 'bg-white/20 text-white font-normal'
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
                                    ? 'bg-white/25 text-white font-normal'
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
                        ? 'bg-white/20 text-white font-normal'
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
        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-normal transition-colors ${
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
        style={{ overflow: 'visible' }}
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
        <nav className="flex-1 px-1 py-2 space-y-1 overflow-y-auto overflow-x-visible scrollbar-hide" style={{ overflowX: 'visible', position: 'relative' }}>
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
                  <span className="text-sm font-normal">Collapse</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
