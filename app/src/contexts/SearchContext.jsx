import React, { createContext, useContext, useState, useCallback } from 'react';
import { searchAPI } from '../lib/api';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // Universal search function
  const performSearch = useCallback(async (query, filters = {}) => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }

    try {
      setIsSearching(true);
      
      const response = await searchAPI.universal({
        q: query,
        ...filters
      });
      
      // Backend returns { success, query, results, summary, total }
      const backendResults = response.data?.results || [];
      
      // Transform backend results to match UI format
      const formattedResults = backendResults.map(item => ({
        id: item.id,
        type: item.type,
        title: item.name || item.subject || 'Untitled',
        subtitle: item.code || item.email || item.location || item.status || '',
        description: item.gstin || item.role || item.priority || '',
        url: item.url,
        ...item // Keep all original data
      }));

      setSearchResults(formattedResults);
      
      // Add to search history
      addToSearchHistory(query);
      
      return formattedResults;
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Specific search functions (using universal search with type filters)
  const searchLedgers = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    try {
      setIsSearching(true);
      const response = await searchAPI.universal({
        q: query,
        type: 'ledgers'
      });
      
      const results = response.data?.results || [];
      return results.map(item => ({
        id: item.id,
        type: 'ledger',
        title: item.name,
        subtitle: item.code || '',
        ...item
      }));
    } catch (error) {
      console.error('Ledger search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchVouchers = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    try {
      setIsSearching(true);
      const response = await searchAPI.universal({
        q: query,
        type: 'vouchers'
      });
      
      const results = response.data?.results || [];
      return results.map(item => ({
        id: item.id,
        type: 'voucher',
        title: item.name,
        subtitle: item.subtype || item.date || '',
        ...item
      }));
    } catch (error) {
      console.error('Voucher search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchInventory = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    try {
      setIsSearching(true);
      const response = await searchAPI.universal({
        q: query,
        type: 'inventory'
      });
      
      const results = response.data?.results || [];
      return results.map(item => ({
        id: item.id,
        type: 'inventory',
        title: item.name,
        subtitle: item.code || item.hsn || '',
        ...item
      }));
    } catch (error) {
      console.error('Inventory search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchCompanies = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    try {
      setIsSearching(true);
      const response = await searchAPI.universal({
        q: query,
        type: 'companies'
      });
      
      const results = response.data?.results || [];
      return results.map(item => ({
        id: item.id,
        type: 'company',
        title: item.name,
        subtitle: item.gstin || '',
        ...item
      }));
    } catch (error) {
      console.error('Company search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Add to search history
  const addToSearchHistory = useCallback((query) => {
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(item => item !== query)];
      return newHistory.slice(0, 10); // Keep only last 10 searches
    });
    
    setRecentSearches(prev => {
      const newRecent = [query, ...prev.filter(item => item !== query)];
      return newRecent.slice(0, 5); // Keep only last 5 recent searches
    });
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    setRecentSearches([]);
  }, []);

  const value = {
    // State
    searchQuery,
    searchResults,
    isSearching,
    searchHistory,
    recentSearches,
    
    // Actions
    setSearchQuery,
    performSearch,
    searchLedgers,
    searchVouchers,
    searchInventory,
    searchCompanies,
    addToSearchHistory,
    clearSearch,
    clearSearchHistory,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};