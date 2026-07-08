import React, { useMemo } from 'react';
import { Channel } from '../types';
import { Tv, Heart, LayoutGrid, Tag } from 'lucide-react';

interface SidebarProps {
  channels: Channel[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  showFavorites: boolean;
  onToggleFavoritesView: (show: boolean) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ 
  channels, 
  selectedCategory, 
  onSelectCategory,
  showFavorites,
  onToggleFavoritesView,
  isOpen,
  setIsOpen
}: SidebarProps) {

  const categories = useMemo(() => {
    const cats = new Set<string>();
    channels.forEach(c => cats.add(c.category));
    return Array.from(cats)
        .filter(c => c && c.trim() !== '' && c !== 'Undefined')
        .sort((a, b) => a.localeCompare(b));
  }, [channels]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 bg-[#080808] border-r border-[#1A1A1A] w-64 z-30 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:relative md:h-screen
      `}>
        <div className="p-6 border-b border-[#1A1A1A] flex items-center space-x-3 shrink-0">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">StreamTV</h1>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar">
          
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-bold mb-4 px-3">
              Koleksi
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onToggleFavoritesView(false);
                  onSelectCategory('');
                  if(window.innerWidth < 768) setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${!showFavorites && selectedCategory === '' ? 'bg-[#111] text-white' : 'text-[#888] hover:text-white hover:bg-[#111]'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">Semua Saluran</span>
              </button>
              
              <button
                onClick={() => {
                  onToggleFavoritesView(true);
                  if(window.innerWidth < 768) setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${showFavorites ? 'bg-[#111] text-white' : 'text-[#888] hover:text-white hover:bg-[#111]'}`}
              >
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Favorit Saya</span>
              </button>
            </div>
          </div>

          <div>
             <div className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-bold mb-4 px-3">
              Kategori Kustom
            </div>
            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    onSelectCategory(category);
                    onToggleFavoritesView(false);
                    if(window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${selectedCategory === category && !showFavorites ? 'bg-[#111] text-white' : 'text-[#888] hover:text-white hover:bg-[#111]'}`}
                  title={category}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium truncate">{category}</span>
                </button>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
