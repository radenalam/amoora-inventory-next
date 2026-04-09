'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface ProductOption {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
}

interface ProductSearchInputProps {
  products: ProductOption[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: ProductOption) => void;
  placeholder?: string;
}

export default function ProductSearchInput({ products, value, onChange, onSelect, placeholder = 'Ketik atau cari produk...' }: ProductSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length > 0
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (product: ProductOption) => {
    onChange(product.name);
    setQuery('');
    setIsOpen(false);
    onSelect(product);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
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
          onFocus={() => { if (query || value) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent pr-8"
          placeholder={placeholder}
          required
        />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button type="button" onClick={() => { onChange(''); setQuery(''); inputRef.current?.focus(); }} className="p-0.5 text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
          <Search className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${index !== filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <span className="text-sm font-medium text-gray-900">{product.name}</span>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span>{formatCurrency(product.price)} / {product.unit}</span>
                {product.description && <span className="text-gray-400">· {product.description}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length > 0 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500">
            Produk &quot;{query}&quot; tidak ditemukan.
            <span className="font-medium text-gray-700"> Lanjutkan ketik untuk input manual.</span>
          </p>
        </div>
      )}
    </div>
  );
}
