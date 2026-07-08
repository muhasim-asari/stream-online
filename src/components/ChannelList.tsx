import React, { useEffect, useRef, useState } from 'react';
import { Channel } from '../types';
import { Play, Heart, Image as ImageIcon } from 'lucide-react';

interface ChannelListProps {
  channels: Channel[];
  favorites: string[];
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (id: string) => void;
}

const ITEMS_PER_PAGE = 50;

export function ChannelList({ channels, favorites, onPlay, onToggleFavorite }: ChannelListProps) {
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE); // Reset when channel array changes (like searching)
  }, [channels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCount < channels.length) {
          setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, channels.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [displayedCount, channels.length]);

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p>Tidak ada saluran yang ditemukan.</p>
      </div>
    );
  }

  const displayedChannels = channels.slice(0, displayedCount);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-8 content-start">
      {displayedChannels.map((channel) => {
        const isFav = favorites.includes(channel.id);
        
        return (
          <div 
            key={channel.id + channel.url} 
            className="group relative bg-[#0C0C0C] border border-[#1A1A1A] p-4 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-start text-left"
            onClick={() => onPlay(channel)}
          >
             <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(channel.id);
              }}
              className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors z-20 
                ${isFav ? 'text-red-500' : 'text-[#222] group-hover:text-[#555] hover:!text-white'}`}
              title={isFav ? "Hapus dari Favorit" : "Tambah ke Favorit"}
            >
              <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
            </button>

            <div className="h-20 w-full bg-[#151515] rounded-md mb-3 flex items-center justify-center text-2xl font-bold text-[#222] overflow-hidden shrink-0 relative">
              {channel.logo ? (
                <img 
                  src={channel.logo} 
                  alt={channel.name}
                  className="w-full h-full object-contain p-2 z-10 relative"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = ''; 
                    (e.target as HTMLImageElement).className = 'hidden';
                    ((e.target as HTMLElement).nextElementSibling as HTMLElement)?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`absolute select-none uppercase ${channel.logo ? 'hidden' : ''}`}>
                {channel.name.substring(0, 3)}
              </div>
            </div>
            
            <h3 className="font-semibold text-sm text-white line-clamp-1 w-full">
              {channel.name}
            </h3>
            
            <div className="mt-auto pt-1 w-full text-left">
                <span className="text-[10px] text-[#555] line-clamp-1 inline-block w-full">
                  {channel.category} {channel.country ? `• ${channel.country}` : ''}
                </span>
            </div>
            
            <div className="absolute inset-0 bg-[#050505]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] rounded-xl z-10 flex-col">
              <div className="bg-blue-600 p-3 rounded-full text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <Play className="w-6 h-6 fill-current pl-0.5" />
              </div>
            </div>
          </div>
        );
      })}
      
      {displayedCount < channels.length && (
        <div ref={observerTarget} className="flex justify-center p-4 col-span-full">
          <div className="w-6 h-6 border-2 border-[#1A1A1A] border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
