
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { getCitySuggestions } from '../services/geminiService';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (term.length >= 3) {
        setIsSuggesting(true);
        const results = await getCitySuggestions(term);
        setSuggestions(results);
        setIsSuggesting(false);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [term]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      onSearch(term);
      setShowSuggestions(false);
      setTerm('');
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setTerm(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    setTerm('');
  };

  return (
    <div className="relative w-full h-12" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative w-full h-full">
        <div className="relative flex items-center h-full">
          <div className="absolute left-4 text-black z-10">
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="SEARCH CITY..."
            className="w-full h-full pl-12 pr-12 border border-black bg-white focus:outline-none transition-all uppercase font-bold placeholder:text-gray-400 text-sm rounded-xl"
            disabled={isLoading}
            autoComplete="off"
          />
          <button 
            type="submit"
            className="absolute right-1 top-1 bottom-1 bg-black text-white px-3 hover:bg-gray-800 transition-colors rounded-r-lg"
            disabled={isLoading}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 bg-white border-x border-b border-black z-50 max-h-60 overflow-y-auto rounded-b-xl shadow-sm mt-1">
          {suggestions.map((city, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(city)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-0 text-sm font-bold uppercase flex justify-between items-center"
            >
              {city}
              {isSuggesting && index === 0 && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
