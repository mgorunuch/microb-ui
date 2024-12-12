'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from '@headlessui/react';
import { ChevronDown, Search, Loader2, ExternalLink } from 'lucide-react';

interface DomainData {
  domain: string;
  relatedDomains: string[];
  relatedHostnames: string[];
  recordTypes: string[];
  commandRuns: string[];
  commandCount: number;
}

const DomainTable = () => {
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DomainData;
    direction: 'asc' | 'desc';
  }>({ key: 'domain', direction: 'asc' });

  const fetchDomains = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError('');

      const url = new URL('/api/domains', window.location.origin);
      if (search) {
        url.searchParams.set('search', search);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch domain data');
      }

      const data = await response.json();
      setDomains(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDomains(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchDomains]);

  const handleSort = (key: keyof DomainData) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const sortedDomains = [...domains].sort((a, b) => {
    if (sortConfig.key === 'domain' || sortConfig.key === 'commandCount') {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    }
    return 0;
  });

  const DetailCell = ({ items }: { items: string[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (items.length === 0) return <span className="text-gray-400">None</span>;

    if (items.length <= 2 || isExpanded) {
      return (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="text-sm">{item}</div>
          ))}
          {items.length > 2 && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-primary text-sm hover:underline"
            >
              Show less
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {items.slice(0, 2).map((item, index) => (
          <div key={index} className="text-sm">{item}</div>
        ))}
        <button
          onClick={() => setIsExpanded(true)}
          className="text-primary text-sm hover:underline"
        >
          Show {items.length - 2} more...
        </button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 p-4 flex items-center justify-center">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="container mx-auto">
        <div className="bg-base-100 rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Domain Relationships</h2>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search domains..."
                  className="input input-bordered pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
              <tr>
                <th
                  onClick={() => handleSort('domain')}
                  className="cursor-pointer hover:bg-base-200"
                >
                  Domain
                  {sortConfig.key === 'domain' && (
                    <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                  )}
                </th>
                <th>Related Domains</th>
                <th>Hostnames</th>
                <th>Record Types</th>
                <th>Command Runs</th>
                <th
                  onClick={() => handleSort('commandCount')}
                  className="cursor-pointer hover:bg-base-200"
                >
                  Command Count
                  {sortConfig.key === 'commandCount' && (
                    <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                  )}
                </th>
              </tr>
              </thead>
              <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sortedDomains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    No domains found
                  </td>
                </tr>
              ) : (
                sortedDomains.map((domain, index) => (
                  <tr key={index}>
                    <td className="font-medium">{domain.domain}</td>
                    <td><DetailCell items={domain.relatedDomains} /></td>
                    <td><DetailCell items={domain.relatedHostnames} /></td>
                    <td><DetailCell items={domain.recordTypes} /></td>
                    <td><DetailCell items={domain.commandRuns} /></td>
                    <td>{domain.commandCount}</td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainTable;
