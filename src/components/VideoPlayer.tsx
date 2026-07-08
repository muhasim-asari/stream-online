import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, AlertCircle, Server } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({ url, poster, autoPlay = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(false);

  useEffect(() => {
    let hls: Hls | null = null;
    const video = videoRef.current;

    if (!video) return;

    setLoading(true);
    setError(null);

    const initPlayer = () => {
      const targetUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(url)}` : url;

      if (Hls.isSupported()) {
        hls = new Hls({
            // HLS config to help with some tricky IPTV streams
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
        });
        hls.loadSource(targetUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          if (autoPlay) {
            video.play().catch(e => {
                console.warn("Auto-play prevented", e);
                // Autoplay may fail if no interaction
            });
          }
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    setError('CORS_ERROR');
                    hls?.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    setError('Media error: Stream format issue.');
                    hls?.recoverMediaError();
                    break;
                default:
                    hls?.destroy();
                    setError('Fatal video error encountered. The stream might be offline.');
                    break;
                }
                setLoading(false);
            }
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari support
        video.src = targetUrl;
        video.addEventListener('loadedmetadata', () => {
          setLoading(false);
          if (autoPlay) {
            video.play().catch(e => console.warn("Auto-play prevented", e));
          }
        });
        video.addEventListener('error', () => {
            setError('Error loading stream.');
            setLoading(false);
        });
      } else {
        setError('HLS is not supported in this browser.');
        setLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url, autoPlay, useProxy]);

  // Reset proxy state when url changes
  useEffect(() => {
    setUseProxy(false);
  }, [url]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/80 z-10 text-[#E0E0E0]">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-sm font-medium">Memuat siaran...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] text-red-500 p-6 text-center z-10">
          <AlertCircle className="w-12 h-12 mb-3 opacity-80" />
          {error === 'CORS_ERROR' ? (
            <div className="max-w-md flex flex-col items-center">
               <h3 className="text-lg font-bold text-white mb-2">Pemblokiran CORS Terdeteksi</h3>
               <p className="text-sm text-[#AAA] mb-4">
                 Server stasiun TV ini tidak mengizinkan pemutar dari browser web secara langsung.
               </p>
               <div className="flex flex-col gap-3 w-full">
                 <button 
                   onClick={() => setUseProxy(true)}
                   className="flex items-center justify-center gap-2 bg-[#222] hover:bg-[#333] text-white text-xs font-semibold py-2.5 px-4 rounded transition-colors w-full border border-[#444]"
                 >
                   <Server className="w-4 h-4 text-green-400" />
                   Coba Lewati dengan Proxy Server Internal
                 </button>
                 
                 <div className="bg-[#111] border border-[#222] rounded-lg p-4 w-full mt-2">
                   <p className="text-xs text-[#E0E0E0] mb-3 text-left">
                     <strong className="text-blue-400">Solusi Alternatif (Lebih Stabil):</strong> Pasang ekstensi Chrome untuk mengizinkan CORS secara permanen.
                   </p>
                   <a 
                     href="https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded transition-colors w-full"
                   >
                     Install Ekstensi Chrome (CORS)
                   </a>
                 </div>
               </div>
            </div>
          ) : (
             <p className="text-sm font-medium">{error}</p>
          )}
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        poster={poster}
      />
    </div>
  );
}
