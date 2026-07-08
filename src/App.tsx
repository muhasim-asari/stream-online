/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ChannelList } from './components/ChannelList';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { useAppStore } from './store';
import { parseM3U } from './lib/m3uParser';
import { Channel, Playlist } from './types';
import { Search, Menu, X, Plus, PlayCircle, Loader2, AlertCircle, Heart } from 'lucide-react';

import { CountrySelect, CountryInfo } from './components/CountrySelect';

export default function App() {
  const { playlists, addPlaylist, removePlaylist, favorites, toggleFavorite } = useAppStore();
  
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [countriesApi, setCountriesApi] = useState<Record<string, {name: string, flag: string}>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function loadPlaylists() {
      setLoading(true);
      setError(null);
      let combinedChannels: Channel[] = [];
      
      try {
        for (const playlist of playlists) {
          const response = await fetch(playlist.url);
          if (!response.ok) throw new Error(`Gagal memuat playlist: ${playlist.name}`);
          const text = await response.text();
          const parsed = parseM3U(text, playlist.id);
          combinedChannels = [...combinedChannels, ...parsed];
        }
        setAllChannels(combinedChannels);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat memuat saluran.');
      } finally {
        setLoading(false);
      }
    }
    
    loadPlaylists();
  }, [playlists]);

  useEffect(() => {
    fetch('https://iptv-org.github.io/api/countries.json')
      .then(res => res.json())
      .then((data: any[]) => {
        const map: Record<string, {name: string, flag: string}> = {};
        data.forEach(c => {
            map[c.code] = { name: c.name, flag: c.flag };
        });
        setCountriesApi(map);
      })
      .catch(err => {
        console.error("Gagal memuat data negara:", err);
      });
  }, []);

  const countriesList: CountryInfo[] = useMemo(() => {
    const cSet = new Set<string>();
    allChannels.forEach(c => {
       if (c.country && c.country.trim() !== '' && c.country !== 'Undefined') {
           cSet.add(c.country);
       }
    });
    
    return Array.from(cSet).map(code => {
        const primaryCode = code.split(/[,;]/)[0].trim().toUpperCase();
        const apiData = countriesApi[primaryCode];
        return {
            id: code,
            name: apiData ? apiData.name : code,
            flag: apiData ? apiData.flag : null
        };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allChannels, countriesApi]);

  const filteredChannels = useMemo(() => {
    let result = allChannels;

    if (showFavorites) {
      result = result.filter(c => favorites.includes(c.id));
    } else if (selectedCategory) {
      result = result.filter(c => c.category === selectedCategory);
    }

    if (selectedCountry) {
      result = result.filter(c => c.country === selectedCountry);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }

    return result;
  }, [allChannels, showFavorites, selectedCategory, selectedCountry, searchQuery, favorites]);

  return (
    <div className="flex bg-[#050505] text-[#E0E0E0] min-h-screen font-sans selection:bg-blue-500/30">
      <Sidebar 
        channels={allChannels}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        showFavorites={showFavorites}
        onToggleFavoritesView={setShowFavorites}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-[#1A1A1A] bg-[#080808] flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 text-[#888] hover:text-white md:hidden rounded-lg hover:bg-[#111]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-3xl font-light tracking-tight text-white hidden sm:block">
              {showFavorites ? 'Favorit Saya' : selectedCategory || 'Semua'} <span className="italic font-serif opacity-60 text-blue-400">Saluran</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="bg-[#111] border border-[#222] rounded-full px-4 py-1.5 flex items-center gap-2 w-full sm:w-64 transition-colors focus-within:border-blue-500/50">
              <Search className="w-4 h-4 text-[#555] shrink-0" />
              <input 
                type="text" 
                placeholder="Cari saluran..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-xs w-full text-[#AAA] placeholder-[#555]"
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="hidden sm:flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Import M3U List</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="sm:hidden p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#050505]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-[#888] space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p>Mengambil Data Siaran...</p>
            </div>
          ) : error && allChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 space-y-4 px-4 text-center">
              <AlertCircle className="w-12 h-12 mb-2 opacity-80" />
              <p className="max-w-md">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-[#111] border border-[#222] hover:text-white text-[#AAA] px-4 py-2 rounded-lg text-sm mt-4 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto pb-24">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 pt-8 pb-4 gap-4">
                  <h2 className="text-xl font-medium text-white sm:hidden">
                    {showFavorites ? 'Favorit Saya' : selectedCategory || 'Semua Saluran'}
                  </h2>
                  <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#555] uppercase shrink-0 hidden sm:block">Negara:</span>
                    <CountrySelect 
                      countries={countriesList} 
                      selectedCountry={selectedCountry} 
                      onSelect={setSelectedCountry} 
                    />
                  </div>
               </div>
               <ChannelList 
                  channels={filteredChannels}
                  favorites={favorites}
                  onPlay={setActiveChannel}
                  onToggleFavorite={toggleFavorite}
               />
               <div className="h-safe-bottom"></div>
            </div>
          )}
        </main>
      </div>

      {/* Video Modal / Overlay */}
      {activeChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-0 sm:p-6 animation-fade-in">
          <div className="w-full max-w-5xl bg-[#0A0A0A] border border-[#1A1A1A] sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-[#1A1A1A] bg-[#050505]">
              <div className="flex items-center space-x-3 truncate">
                {activeChannel.logo && (
                   <img src={activeChannel.logo} alt="" className="w-8 h-8 object-contain bg-white/10 rounded-full p-1 shrink-0" />
                )}
                <div>
                   <h3 className="font-semibold text-lg text-white truncate">{activeChannel.name}</h3>
                   <p className="text-xs text-gray-400">{activeChannel.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 ml-4">
                 <button 
                    onClick={() => toggleFavorite(activeChannel.id)}
                    className="p-2 rounded-full hover:bg-[#111] transition-colors"
                  >
                    <Heart className="w-5 h-5" fill={favorites.includes(activeChannel.id) ? "#ef4444" : "none"} color={favorites.includes(activeChannel.id) ? "#ef4444" : "#9ca3af"} />
                 </button>
                 <button 
                    onClick={() => setActiveChannel(null)}
                    className="p-2 bg-[#111] hover:bg-[#222] border border-[#222] text-[#AAA] hover:text-white rounded-full transition-colors relative group"
                  >
                    <X className="w-5 h-5" />
                 </button>
              </div>
            </div>
            <div className="flex-1 bg-black min-h-[30vh] sm:min-h-[50vh]">
              <VideoPlayer 
                url={activeChannel.url} 
                poster={activeChannel.logo}
                autoPlay={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Playlist Modal */}
      {showAddModal && (
        <AddPlaylistModal 
          onClose={() => setShowAddModal(false)} 
          onAdd={(playlist) => {
            addPlaylist(playlist);
            setShowAddModal(false);
          }}
          playlists={playlists}
          onRemove={removePlaylist}
        />
      )}
    </div>
  );
}

function AddPlaylistModal({ 
  onClose, 
  onAdd, 
  playlists,
  onRemove
}: { 
  onClose: () => void, 
  onAdd: (p: Playlist) => void,
  playlists: Playlist[],
  onRemove: (id: string) => void
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    
    onAdd({
      id: Math.random().toString(36).substring(2),
      name: name.trim(),
      url: url.trim(),
      isCustom: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animation-fade-in">
      <div className="bg-[#050505] border border-[#1A1A1A] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-[#E0E0E0]">
        <div className="flex items-center justify-between p-5 border-b border-[#1A1A1A]">
          <h3 className="font-semibold text-lg">Kelola Sumber IPTV</h3>
          <button onClick={onClose} className="text-[#888] hover:text-white p-1 rounded-lg hover:bg-[#111] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
           <form onSubmit={handleSubmit} className="mb-6 space-y-4 border-b border-[#1A1A1A] pb-6">
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1.5">Nama Daftar Putar</label>
                <div className="bg-[#111] border border-[#222] rounded-lg focus-within:border-blue-500/50 transition-colors">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Saluran Lokal" 
                    className="w-full bg-transparent py-2.5 px-3 text-sm text-[#E0E0E0] placeholder-[#555] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1.5">URL M3U (.m3u atau .m3u8)</label>
                <div className="bg-[#111] border border-[#222] rounded-lg focus-within:border-blue-500/50 transition-colors">
                  <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/playlist.m3u" 
                    className="w-full bg-transparent py-2.5 px-3 text-sm text-[#E0E0E0] placeholder-[#555] focus:outline-none"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={!name.trim() || !url.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-[#111] disabled:text-[#555] disabled:border disabled:border-[#222] disabled:cursor-not-allowed text-white text-xs font-semibold py-3 px-4 rounded transition-all flex items-center justify-center space-x-2 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Sumber</span>
              </button>
           </form>

           <div>
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#555] uppercase mb-3 px-1">Sumber Aktif</h4>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                 {playlists.map(p => (
                   <div key={p.id} className="flex flex-col bg-[#111] border border-[#222] p-3 rounded-xl hover:border-blue-500/50 transition-colors space-y-2">
                     <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-white">{p.name}</span>
                        {p.isCustom && (
                          <button 
                            onClick={() => onRemove(p.id)}
                            className="text-red-500 hover:opacity-100 opacity-80 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                     </div>
                     <span className="text-xs text-[#555] truncate">{p.url}</span>
                     {!p.isCustom && (
                        <span className="text-[10px] bg-blue-900/20 text-blue-400 self-start px-2 py-0.5 rounded border border-blue-500/30">Sistem Utama</span>
                     )}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

