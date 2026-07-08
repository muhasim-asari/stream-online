import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({ url, poster, autoPlay = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hls: Hls | null = null;
    const video = videoRef.current;

    if (!video) return;

    setLoading(true);
    setError(null);

    const initPlayer = () => {
      if (Hls.isSupported()) {
        hls = new Hls({
            // HLS config to help with some tricky IPTV streams
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
        });
        hls.loadSource(url);
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
                    setError('Gagal memuat siaran (Pemblokiran CORS). Server TV tidak mengizinkan pemutar berbasis web. Solusi: Gunakan ekstensi Chrome "Allow CORS: Access-Control-Allow-Origin".');
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
        video.src = url;
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
  }, [url, autoPlay]);

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
          <p className="text-sm font-medium">{error}</p>
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
