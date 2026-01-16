import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { getProfileImageUrl } from '../../lib/imageUtils';
import { companyAPI, searchAPI, authAPI, subscriptionAPI, branchAPI } from '../../lib/api';
import { canAccessClientPortal } from '../../lib/roleConfig';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import {
  FiMenu, FiBell, FiSearch, FiUser, FiSettings,
  FiLogOut, FiChevronDown, FiX, FiBriefcase, FiPlus,
  FiFileText, FiPackage, FiLayers, FiCreditCard, FiUsers, FiHeadphones, FiCamera, FiMapPin
} from 'react-icons/fi';
import NotificationDropdown from '../notifications/NotificationDropdown';

export default function Header({ onMenuClick, title, actions }) {
  const { user, logout, switchCompany, updateUser } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const menuRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const branchDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchResultsRef = useRef(null);
  const fetchingCompaniesRef = useRef(false);
  const companiesFetchedRef = useRef(false);
  const lastUserIdRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const profileImageInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current subscription to check if multi-branch
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user || !canAccessClientPortal(user.role)) return;
      
      try {
        const response = await subscriptionAPI.getCurrent();
        const sub = response.data?.subscription;
        setSubscription(sub);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    if (mounted && user) {
      fetchSubscription();
    }
  }, [user, mounted]);

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

  // Fetch branches for multi-branch subscriptions
  useEffect(() => {
    const fetchBranches = async () => {
      if (!user?.company_id || !subscription || subscription.plan_type !== 'multi-branch') {
        setBranches([]);
        return;
      }

      setLoadingBranches(true);
      try {
        const response = await branchAPI.list(user.company_id);
        const branchesData = response.data?.data || response.data || [];
        setBranches(Array.isArray(branchesData) ? branchesData : []);
        
        // Set current branch from localStorage or default to first
        const savedBranchId = localStorage.getItem('currentBranchId');
        if (savedBranchId) {
          const branch = branchesData.find(b => b.id === savedBranchId);
          setCurrentBranch(branch || branchesData[0] || null);
        } else {
          setCurrentBranch(branchesData[0] || null);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    if (mounted && user && subscription) {
      fetchBranches();
    }
  }, [user, subscription, mounted]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setShowBranchDropdown(false);
      }
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Universal search handler
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await searchAPI.universal({ q: query, limit: 10 });
      const results = response.data?.results || [];
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  const handleSearchResultClick = (result) => {
    if (result.url) {
      router.push(result.url);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const getSearchResultIcon = (type) => {
    switch (type) {
      case 'ledger':
        return FiFileText;
      case 'voucher':
        return FiFileText;
      case 'inventory':
        return FiPackage;
      case 'warehouse':
        return FiLayers;
      case 'company':
        return FiBriefcase;
      case 'tenant':
        return FiBriefcase;
      case 'distributor':
        return FiUsers;
      case 'salesman':
        return FiUsers;
      case 'user':
        return FiUser;
      case 'support_ticket':
        return FiHeadphones;
      default:
        return FiSearch;
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    
    // Redirect to appropriate login page based on current path
    const currentPath = router.pathname;
    if (currentPath.startsWith('/admin')) {
      router.replace('/admin/login');
    } else if (currentPath.startsWith('/client')) {
      router.replace('/client/login');
    } else {
      // Default to client login for other paths
      router.replace('/client/login');
    }
  };

  const handleProfileImageClick = () => {
    if (profileImageInputRef.current) {
      profileImageInputRef.current.click();
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingProfileImage(true);
      const formData = new FormData();
      formData.append('profile_image', file);

      const response = await authAPI.uploadProfileImage(formData);
      const updatedUser = response.data?.data?.user || response.data?.user || response.data;

      // Update auth context
      updateUser({
        profile_image: updatedUser.profile_image,
        name: updatedUser.name || user?.name,
      });

      toast.success('Profile picture updated successfully');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingProfileImage(false);
      // Reset file input
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = '';
      }
    }
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

  const handleBranchSwitch = (branch) => {
    if (branch.id === currentBranch?.id) {
      setShowBranchDropdown(false);
      return;
    }

    setCurrentBranch(branch);
    localStorage.setItem('currentBranchId', branch.id);
    setShowBranchDropdown(false);
    toast.success(`Switched to ${branch.branch_name}`);
    // Optionally reload to refresh data for the new branch
    // router.reload();
  };

  const isClientUser = user && canAccessClientPortal(user.role);
  const currentCompany = companies.find(c => c.id === user?.company_id);

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-[55] shadow-sm w-full">
      <div className="flex items-center h-16 px-4 sm:px-6">
        {/* Left: Logo and Menu button */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="bg-white rounded-md px-3 py-2 flex items-center justify-center">
            <Image 
              src="/Finallogo.png" 
              alt="Finverra" 
              width={3464}
              height={889}
              className="h-10 w-auto object-contain max-w-[180px]"
              priority
            />
          </div>
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
          <div className="relative ml-3" ref={companyDropdownRef}>
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

        {/* Branch Selection Dropdown (for multi-branch subscriptions) */}
        {isClientUser && subscription?.plan_type === 'multi-branch' && (
          <div className="relative ml-2" ref={branchDropdownRef}>
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              disabled={loadingBranches}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiMapPin className="h-4 w-4 text-gray-500" />
              <span className="hidden sm:block max-w-[120px] truncate">
                {loadingBranches ? 'Loading...' : (currentBranch?.branch_name || 'Select Branch')}
              </span>
              <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showBranchDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[70] max-h-80 overflow-y-auto">
                {loadingBranches ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading branches...</div>
                ) : branches.length === 0 ? (
                  <div className="px-4 py-3">
                    <div className="text-sm text-gray-500 text-center mb-2">No branches found</div>
                    <button
                      onClick={() => {
                        setShowBranchDropdown(false);
                        router.push('/client/companies'); // Navigate to company/branch management
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
                    >
                      <FiPlus className="h-4 w-4" />
                      <span>Create Branch</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {branches.map((branch) => {
                      const isCurrentBranch = branch.id === currentBranch?.id;
                      return (
                        <button
                          key={branch.id}
                          onClick={() => !isCurrentBranch && handleBranchSwitch(branch)}
                          disabled={isCurrentBranch}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition ${
                            isCurrentBranch
                              ? 'bg-green-50 text-green-700 font-medium cursor-default'
                              : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                          } disabled:opacity-100`}
                        >
                          <FiMapPin className={`h-4 w-4 ${isCurrentBranch ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{branch.branch_name}</div>
                            {branch.branch_code && (
                              <div className="text-xs text-gray-500 truncate">Code: {branch.branch_code}</div>
                            )}
                          </div>
                          {isCurrentBranch && (
                            <span className="text-green-600 text-xs font-medium">Current</span>
                          )}
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowBranchDropdown(false);
                        router.push('/client/companies'); // Navigate to branch management
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 transition"
                    >
                      <FiPlus className="h-4 w-4" />
                      <span>Create New Branch</span>
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
          <div className="hidden md:flex items-center relative w-full max-w-md" ref={searchRef}>
            <FiSearch className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ledgers, vouchers, inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
            />
            {searchLoading && (
              <div className="absolute right-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div 
                ref={searchResultsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-[70] max-h-96 overflow-y-auto"
              >
                {searchResults.map((result, index) => {
                  const Icon = getSearchResultIcon(result.type);
                  return (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{result.name || result.subject}</div>
                        {result.code && (
                          <div className="text-sm text-gray-500 truncate">Code: {result.code}</div>
                        )}
                        {result.subtype && (
                          <div className="text-xs text-gray-400 capitalize">{result.subtype}</div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded">{result.type.replace('_', ' ')}</span>
                    </button>
                  );
                })}
              </div>
            )}
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
          {user && <NotificationDropdown />}

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
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="relative cursor-pointer group"
                        onClick={handleProfileImageClick}
                        title="Click to update profile picture"
                      >
                        {user?.profile_image ? (
                          <div className="relative h-12 w-12">
                            <Image
                              src={getProfileImageUrl(user.profile_image) || ''}
                              alt={user?.name || user?.email || 'User'}
                              fill
                              className="rounded-full object-cover border-2 border-primary-200 group-hover:opacity-80 transition"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                              unoptimized
                            />
                            <div className="hidden h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium absolute top-0 left-0">
                              {(user?.name?.charAt(0) || user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                            </div>
                            {uploadingProfileImage && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              </div>
                            )}
                            {!uploadingProfileImage && (
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition">
                                <FiCamera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium group-hover:opacity-80 transition relative">
                            {(user?.name?.charAt(0) || user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                            {uploadingProfileImage && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              </div>
                            )}
                            {!uploadingProfileImage && (
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition">
                                <FiCamera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                      {user?.name || user?.full_name || user?.email || 'User'}
                    </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {user?.email || ''}
                        </div>
                      </div>
                    </div>
                    <input
                      ref={profileImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      disabled={uploadingProfileImage}
                    />
                  </div>
                  <button
                    onClick={handleProfileImageClick}
                    disabled={uploadingProfileImage}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiCamera className="h-4 w-4" />
                    <span>{uploadingProfileImage ? 'Uploading...' : 'Update Profile Picture'}</span>
                  </button>
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
        <div className="md:hidden border-t border-gray-200 px-4 py-3 bg-white" ref={searchRef}>
          <div className="flex items-center relative">
            <FiSearch className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ledgers, vouchers, inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
              autoFocus
            />
            <button
              onClick={() => {
                setShowMobileSearch(false);
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          {/* Mobile Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div 
              ref={searchResultsRef}
              className="mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-[70] max-h-64 overflow-y-auto"
            >
              {searchResults.map((result, index) => {
                const Icon = getSearchResultIcon(result.type);
                return (
                  <button
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                  >
                    <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{result.name || result.subject}</div>
                      {result.code && (
                        <div className="text-sm text-gray-500 truncate">Code: {result.code}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
