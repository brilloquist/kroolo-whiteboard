import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface UserSearchDropdownProps {
  onSelect: (user: User) => void;
  excludeIds?: string[];
  placeholder?: string;
  className?: string;
}

const UserSearchDropdown = ({ 
  onSelect, 
  excludeIds = [], 
  placeholder = "Search users...",
  className = ""
}: UserSearchDropdownProps) => {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchUsers = async (searchQuery: string) => {
    if (!profile || !searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('domain_id', profile.domain_id)
        .not('id', 'in', `(${[profile.id, ...excludeIds].join(',')})`)
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, profile, excludeIds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: User) => {
    onSelect(user);
    setQuery('');
    setUsers([]);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setUsers([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (query.trim() || users.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-400">
              <div className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : users.length > 0 ? (
            users.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 transition-colors text-left"
              >
                <Avatar
                  src={user.avatar_url}
                  name={user.full_name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {user.full_name}
                  </div>
                  <div className="text-gray-400 text-sm truncate">
                    {user.email}
                  </div>
                </div>
              </button>
            ))
          ) : query.trim() ? (
            <div className="p-3 text-center text-gray-400">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default UserSearchDropdown;