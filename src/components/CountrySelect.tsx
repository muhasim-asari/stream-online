import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface CountryInfo {
  id: string; // The original code from M3U
  name: string;
  flag: string | null;
}

interface CountrySelectProps {
  countries: CountryInfo[];
  selectedCountry: string;
  onSelect: (country: string) => void;
}

export function CountrySelect({ countries, selectedCountry, onSelect }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    return countries.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [countries, search]);

  const selectedData = countries.find(c => c.id === selectedCountry);

  return (
    <div className="relative w-full sm:w-64 z-20" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 flex items-center justify-between text-xs text-[#E0E0E0] hover:border-blue-500/50 transition-colors focus:outline-none focus:border-blue-500/50"
      >
        <div className="flex items-center gap-2 truncate text-left">
           <span className="text-base leading-none">{selectedData?.flag || '🌍'}</span>
           <span className="truncate">{selectedData ? selectedData.name : 'Semua Negara'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#555] transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-[#222] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-80 animation-fade-in">
          <div className="p-2 border-b border-[#222] shrink-0 sticky top-0 bg-[#0A0A0A] z-10">
            <div className="bg-[#111] border border-[#222] rounded flex items-center px-2 py-1.5 focus-within:border-blue-500/50">
              <Search className="w-3.5 h-3.5 text-[#555] mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Cari negara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="bg-transparent outline-none text-xs text-[#E0E0E0] placeholder-[#555] w-full"
              />
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar p-1">
            <button
              onClick={() => { onSelect(''); setIsOpen(false); setSearch(''); }}
              className={`w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-[#111] transition-colors ${!selectedCountry ? 'text-blue-400 bg-blue-900/10' : 'text-[#AAA]'}`}
            >
              <span className="text-base leading-none">🌍</span>
              <span className="flex-1 truncate">Semua Negara</span>
              {!selectedCountry && <Check className="w-4 h-4 text-blue-500" />}
            </button>
            
            {filteredCountries.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-[#555]">
                    Tidak ditemukan
                </div>
            ) : (
                filteredCountries.map(c => {
                    const isSelected = selectedCountry === c.id;
                    return (
                        <button
                            key={c.id}
                            onClick={() => { onSelect(c.id); setIsOpen(false); setSearch(''); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-[#111] transition-colors ${isSelected ? 'text-blue-400 bg-blue-900/10' : 'text-[#AAA]'}`}
                        >
                            {c.flag ? (
                               <span className="text-base leading-none">{c.flag}</span>
                            ) : (
                               <div className="w-4" />
                            )}
                            <span className="flex-1 truncate">{c.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                        </button>
                    )
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
