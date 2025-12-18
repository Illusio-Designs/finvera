import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { getProfileImageUrl } from '../../lib/imageUtils';
import { companyAPI } from '../../lib/api';
import { canAccessClientPortal } from '../../lib/roleConfig';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import {
  FiMenu, FiBell, FiSearch, FiUser, FiSettings,
  FiLogOut, FiChevronDown, FiX, FiBriefcase, FiPlus
} from 'react-icons/fi';

export default function Header({ onMenuClick, title, actions }) {
  const { user, logout, switchCompany } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const fetchingCompaniesRef = useRef(false);
  const companiesFetchedRef = useRef(false);
  const lastUserIdRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch companies for client users
  useEffect(() => {
    const fetchCompanies = async () => {
      // Only run on client side
      if (typeof window === 'undefined') return;
      
      // Prevent multiple simultaneous calls
      if (fetchingCompaniesRef.current) return;
      
      // Check if user is authenticated and is a client user
      if (!user || !canAccessClientPortal(user.role)) {
        setCompanies([]);
        companiesFetchedRef.current = false;
        lastUserIdRef.current = null;
        return;
      }

      // Check if we already fetched companies for this user
      const currentUserId = user.id || user.user_id;
      if (companiesFetchedRef.current && lastUserIdRef.current === currentUserId && companies.length > 0) {
        return; // Already fetched and user hasn't changed
      }

      // Check if we have a token before making the request
      const token = Cookies.get('token');
      if (!token) {
        setCompanies([]);
        companiesFetchedRef.current = false;
        return;
      }

      fetchingCompaniesRef.current = true;
      setLoadingCompanies(true);
      try {
        const response = await companyAPI.list();
        const companiesData = response.data?.data || response.data || [];
        
        // Ensure we have an array
        if (!Array.isArray(companiesData)) {
          setCompanies([]);
          companiesFetchedRef.current = true;
          lastUserIdRef.current = currentUserId;
          return;
        }
        
        // Filter out invalid entries and deduplicate companies by ID using a Map
        const companyMap = new Map();
        companiesData.forEach((company) => {
          // Only process valid company objects with an ID
          if (company && company.id && typeof company.id === 'string') {
            // Only add if we haven't seen this ID before
            if (!companyMap.has(company.id)) {
              companyMap.set(company.id, company);
            }
          }
        });
        
        // Convert Map values back to array and ensure we have valid company names
        const uniqueCompanies = Array.from(companyMap.values())
          .filter(company => company.company_name); // Ensure company has a name
        
        setCompanies(uniqueCompanies);
        companiesFetchedRef.current = true;
        lastUserIdRef.current = currentUserId;
      } catch (error) {
        // Silently handle network errors - don't break the UI
        // Network errors can occur if API is not available or user is offline
        if (error.code !== 'ERR_NETWORK' && error.response?.status !== 429) {
          console.error('Error fetching companies:', error);
        }
        // Don't mark as fetched on error so it can retry
        if (error.response?.status === 429) {
          // Rate limited - wait a bit before allowing retry
          setTimeout(() => {
            companiesFetchedRef.current = false;
          }, 5000);
        }
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
        fetchingCompaniesRef.current = false;
      }
    };

    if (mounted && user) {
      fetchCompanies();
    }
  }, [user, companies.length, mounted]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleCompanySwitch = async (companyId) => {
    // Don't switch if it's the same company
    if (companyId === user?.company_id) {
      setShowCompanyDropdown(false);
      return;
    }

    try {
      await switchCompany(companyId);
      setShowCompanyDropdown(false);
      toast.success('Company switched successfully');
      // Reload the page to ensure all data is refreshed with new company context
      router.reload();
    } catch (error) {
      console.error('Error switching company:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to switch company';
      
      // Handle 503 error (database not provisioned)
      if (error.response?.status === 503) {
        toast.error('Company database is being provisioned. Please try again later.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const isClientUser = user && canAccessClientPortal(user.role);
  const currentCompany = companies.find(c => c.id === user?.company_id);

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-[55] shadow-sm w-full">
      <div className="flex items-center h-16 px-4 sm:px-6">
        {/* Left: Logo and Menu button */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Image 
            src="/logo.png" 
            alt="Finverra" 
            width={200}
            height={176}
            className="h-[11rem] w-auto object-contain"
            priority
          />
          {/* Menu button (mobile only) */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <FiMenu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Company Selection Dropdown (for client users) */}
        {isClientUser && (
          <div className="relative" ref={companyDropdownRef}>
            <button
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              disabled={loadingCompanies}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiBriefcase className="h-4 w-4 text-gray-500" />
              <span className="hidden sm:block max-w-[150px] truncate">
                {loadingCompanies ? 'Loading...' : (currentCompany?.company_name || 'Select Company')}
              </span>
              <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCompanyDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[70] max-h-80 overflow-y-auto">
                {loadingCompanies ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading companies...</div>
                ) : companies.length === 0 ? (
                  <div className="px-4 py-3">
                    <div className="text-sm text-gray-500 text-center mb-2">No companies found</div>
                    <button
                      onClick={() => {
                        setShowCompanyDropdown(false);
                        router.push('/client/companies');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
                    >
                      <FiPlus className="h-4 w-4" />
                      <span>Create Company</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {companies.map((company) => {
                      const isCurrentCompany = company.id === user?.company_id;
                      return (
                        <button
                          key={company.id}
                          onClick={() => !isCurrentCompany && handleCompanySwitch(company.id)}
                          disabled={isCurrentCompany}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition ${
                            isCurrentCompany
                              ? 'bg-primary-50 text-primary-700 font-medium cursor-default'
                              : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                          } disabled:opacity-100`}
                        >
                          <FiBriefcase className={`h-4 w-4 ${isCurrentCompany ? 'text-primary-600' : 'text-gray-400'}`} />
                          <span className="flex-1 truncate">{company.company_name}</span>
                          {isCurrentCompany && (
                            <span className="text-primary-600 text-xs font-medium">Current</span>
                          )}
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowCompanyDropdown(false);
                        router.push('/client/companies');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition"
                    >
                      <FiPlus className="h-4 w-4" />
                      <span>Create New Company</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Center: Search bar */}
        <div className="flex-1 flex justify-center px-4">
          {/* Desktop Search */}
          <div className="hidden md:flex items-center relative w-full max-w-md">
            <FiSearch className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
            />
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <FiSearch className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Actions, Notifications, User menu */}
        <div className="flex items-center gap-3">
          {/* Actions */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}

          {/* Notifications */}
          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition relative">
            <FiBell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* User menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                {user?.profile_image ? (
                  <div className="relative h-8 w-8">
                    <Image
                      src={getProfileImageUrl(user.profile_image) || ''}
                      alt={user?.name || user?.email || 'User'}
                      fill
                      className="rounded-full object-cover border-2 border-primary-200"
                      onError={(e) => {
                        // Hide image and show fallback
                        e.target.style.display = 'none';
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                      unoptimized
                    />
                    <div className="hidden h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium absolute top-0 left-0">
                      {(user?.name?.charAt(0) || user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                  </div>
                ) : (
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                    {(user?.name?.charAt(0) || user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || user?.full_name || user?.email || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.role || ''}
                  </div>
                </div>
                <FiChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[70]">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name || user?.full_name || user?.email || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {user?.email || ''}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!mounted) return;
                      const basePath = router.pathname.startsWith('/admin') ? '/admin' : '/client';
                      router.push(`${basePath}/profile`);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <FiUser className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!mounted) return;
                      const basePath = router.pathname.startsWith('/admin') ? '/admin' : '/client';
                      router.push(`${basePath}/settings`);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <FiSettings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <FiLogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden border-t border-gray-200 px-4 py-3 bg-white">
          <div className="flex items-center relative">
            <FiSearch className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
              autoFocus
            />
            <button
              onClick={() => setShowMobileSearch(false)}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
