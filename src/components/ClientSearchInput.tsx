'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Mail, Phone, Plus, Loader2 } from 'lucide-react';

interface ClientOption {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface ClientSearchInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onSelect: (client: ClientOption) => void;
  onCreateNew: (name: string) => void;
  placeholder?: string;
}

export default function ClientSearchInput({ value, onChange, onSelect, onCreateNew, placeholder = 'Ketik nama client...' }: ClientSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const isComposing = useRef(false);

  const searchClients = useCallback(async (q: string) => {
    if (q.length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('amoora_token');
      const res = await fetch(`/api/clients?search=${encodeURIComponent(q)}&limit=8`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isComposing.current) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
    searchTimer.current = setTimeout(() => searchClients(query), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, searchClients]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setSelectedIndex(-1); }, [query]);

  const isNew = query.length > 0 && !results.some(c => c.name.toLowerCase() === query.toLowerCase()) && !loading;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = results.length + (isNew ? 1 : 0);
      setSelectedIndex(i => Math.min(i + 1, max - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (isNew && selectedIndex === results.length) {
        handleCreateNew();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (client: ClientOption) => {
    onChange(client.name);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect(client);
  };

  const handleCreateNew = () => {
    if (!query.trim()) return;
    onCreateNew(query.trim());
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setResults([]);
    onSelect({ id: '', name: '', email: '', phone: '', address: '' });
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={(e) => {
            isComposing.current = false;
            const v = (e.target as HTMLInputElement).value;
            setQuery(v);
            setIsOpen(true);
          }}
          onFocus={() => { if (query || value) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent pr-8"
          placeholder={placeholder}
          required
        />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button type="button" onClick={handleClear} className="p-0.5 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {loading ? <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" /> : <Search className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>

      {isOpen && (results.length > 0 || isNew || loading) && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading && results.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-gray-400">Mencari...</div>
          )}
          {results.map((client, index) => (
            <button
              key={client.id}
              type="button"
              onClick={() => handleSelect(client)}
              className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex flex-col gap-0.5 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${index !== results.length - 1 || isNew ? 'border-b border-gray-50' : ''}`}
            >
              <span className="text-sm font-medium text-gray-900">{client.name}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />{client.email || 'No email'}
                {client.phone && <span className="ml-2 flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
              </span>
            </button>
          ))}
          {isNew && (
            <button
              type="button"
              onClick={handleCreateNew}
              className={`w-full text-left px-3 py-2 hover:bg-green-50 transition-colors flex items-center gap-2 text-green-700 ${
                selectedIndex === results.length ? 'bg-green-50' : ''
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Buat client &quot;{query}&quot;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
