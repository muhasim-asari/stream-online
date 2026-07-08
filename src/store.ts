import { useState, useEffect } from 'react';
import { Channel, Playlist } from './types';

interface AppState {
  channels: Channel[];
  favorites: string[]; // Channel IDs
  playlists: Playlist[];
}

const DEFAULT_PLAYLIST: Playlist = {
  id: 'default',
  name: 'IPTV Org (Global)',
  url: 'https://iptv-org.github.io/iptv/index.m3u',
  isCustom: false,
};

export function useAppStore() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('iptv_playlists');
    return saved ? JSON.parse(saved) : [DEFAULT_PLAYLIST];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('iptv_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('iptv_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addPlaylist = (playlist: Playlist) => setPlaylists(prev => [...prev, playlist]);
  const removePlaylist = (id: string) => setPlaylists(prev => prev.filter(p => p.id !== id));
  
  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  return {
    playlists,
    addPlaylist,
    removePlaylist,
    favorites,
    toggleFavorite,
  };
}
