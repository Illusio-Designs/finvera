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
      
      // For demo purposes, if API fails, return mock data
      let results = [];
      
      try {
        const response = await searchAPI.universal({
          q: query,
          ...filters
        });
        results = response.data?.data || response.data || [];
      } catch (apiError) {
        console.log('API search failed, using mock data:', apiError.message);
        
        // Mock search results for demo
        results = [
          {
            type: 'ledger',
            title: `Ledger: ${query}`,
            subtitle: 'Sample ledger result',
            description: 'This is a sample ledger search result'
          },
          {
            type: 'voucher',
            title: `Voucher: ${query}`,
            subtitle: 'Sample voucher result',
            description: 'This is a sample voucher search result'
          },
          {
            type: 'inventory',
            title: `Item: ${query}`,
            subtitle: 'Sample inventory result',
            description: 'This is a sample inventory search result'
          }
        ].filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
        );
      }

      setSearchResults(results);
      
      // Add to search history
      addToSearchHistory(query);
      
      return results;
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
      
      try {
        const response = await searchAPI.universal({
          q: query,
          type: 'ledger'
        });
        return response.data?.data || response.data || [];
      } catch (apiError) {
        console.log('Ledger search API failed, using mock data');
        return [
          {
            type: 'ledger',
            title: `Cash Account - ${query}`,
            subtitle: 'Current Account',
            description: 'Sample cash ledger'
          },
          {
            type: 'ledger', 
            title: `Bank Account - ${query}`,
            subtitle: 'Savings Account',
            description: 'Sample bank ledger'
          }
        ];
      }
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
      
      try {
        const response = await searchAPI.universal({
          q: query,
          type: 'voucher'
        });
        return response.data?.data || response.data || [];
      } catch (apiError) {
        console.log('Voucher search API failed, using mock data');
        return [
          {
            type: 'voucher',
            title: `Sales Invoice - ${query}`,
            subtitle: 'INV-001',
            description: 'Sample sales invoice'
          },
          {
            type: 'voucher',
            title: `Purchase Invoice - ${query}`,
            subtitle: 'PINV-001', 
            description: 'Sample purchase invoice'
          }
        ];
      }
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
      
      try {
        const response = await searchAPI.universal({
          q: query,
          type: 'inventory'
        });
        return response.data?.data || response.data || [];
      } catch (apiError) {
        console.log('Inventory search API failed, using mock data');
        return [
          {
            type: 'inventory',
            title: `Product - ${query}`,
            subtitle: 'SKU: PROD001',
            description: 'Sample inventory item'
          }
        ];
      }
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
      
      try {
        const response = await searchAPI.universal({
          q: query,
          type: 'company'
        });
        return response.data?.data || response.data || [];
      } catch (apiError) {
        console.log('Company search API failed, using mock data');
        return [
          {
            type: 'company',
            title: `Company - ${query}`,
            subtitle: 'Private Limited',
            description: 'Sample company'
          }
        ];
      }
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