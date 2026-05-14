/**
 * BIKAN Cinematic Micro-Learning Player
 * ──────────────────────────────────────
 * PRD US-ALG-001:
 * - Pemutar video HLS adaptive bitrate streaming
 * - Inisiasi pemutaran < 1.5 detik
 * - Menyimpan posisi tontonan terakhir (timestamp) setiap 5 detik
 * - Dark mode adaptif hardware
 * - Micro-learning segments (3-12 menit per unit)
 * - Speed control (1x, 1.5x, 2x, 3x)
 * - Chapter navigation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

interface Chapter {
  title: string;
  startTime: number; // seconds
}

interface PlayerProps {
  /** HLS manifest URL or direct video URL */
  src: string;
  /** Unique ID for timestamp persistence */
  lessonId: string;
  /** Chapter markers for segment navigation */
  chapters?: Chapter[];
  /** Dark mode state */
  isDark?: boolean;
  /** Callback when video completes */
  onComplete?: () => void;
}

// Storage key for timestamp persistence
const getStorageKey = (lessonId: string) => `bikan-player-${lessonId}`;

export const CinematicPlayer: React.FC<PlayerProps> = ({
  src,
  lessonId,
  chapters = [],
  isDark = false,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const saveIntervalRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState('');

  // ─── HLS.js Integration (loaded via CDN) ───
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initPlayer = async () => {
      // Check if source is HLS (.m3u8)
      if (src.endsWith('.m3u8')) {
        // Dynamically load HLS.js if not already loaded
        if (!(window as any).Hls) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
          script.onload = () => attachHls(video);
          document.head.appendChild(script);
        } else {
          attachHls(video);
        }
      } else {
        // Direct video source (mp4, webm)
        video.src = src;
      }
    };

    const attachHls = (videoEl: HTMLVideoElement) => {
      const Hls = (window as any).Hls;
      if (Hls.isSupported()) {
        const hls = new Hls({
          startLevel: -1, // Auto quality selection
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hls.loadSource(src);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, () => setIsLoading(false));
        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            console.error('[BIKAN Player] HLS fatal error:', data.type);
            // Fallback: try direct source
            videoEl.src = src;
          }
        });
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        videoEl.src = src;
      }
    };

    initPlayer();

    // Restore saved timestamp
    const savedTime = localStorage.getItem(getStorageKey(lessonId));
    if (savedTime) {
      video.currentTime = parseFloat(savedTime);
    }

    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [src, lessonId]);

  // ─── Timestamp Auto-Save (every 5 seconds) ───
  useEffect(() => {
    if (isPlaying) {
      saveIntervalRef.current = window.setInterval(() => {
        const video = videoRef.current;
        if (video && video.currentTime > 0) {
          localStorage.setItem(getStorageKey(lessonId), String(video.currentTime));
        }
      }, 5000);
    } else {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    }

    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [isPlaying, lessonId]);

  // ─── Video Event Handlers ───
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    // Update buffered
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }

    // Update current chapter
    if (chapters.length > 0) {
      const current = [...chapters].reverse().find(ch => video.currentTime >= ch.startTime);
      if (current) setCurrentChapter(current.title);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setIsLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    localStorage.removeItem(getStorageKey(lessonId)); // Clear saved position
    onComplete?.();
  };

  // ─── Controls ───
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const changeSpeed = () => {
    const speeds = [1, 1.5, 2, 3];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newRate = speeds[nextIndex];
    setPlaybackRate(newRate);
    if (videoRef.current) videoRef.current.playbackRate = newRate;
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;

    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * duration;
  };

  const seekToChapter = (startTime: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = startTime;
      if (!isPlaying) togglePlay();
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      localStorage.removeItem(getStorageKey(lessonId));
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  // ─── Time Formatting ───
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Auto-hide controls ───
  useEffect(() => {
    let timeout: number;
    if (isPlaying) {
      timeout = window.setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, currentTime]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      className={`relative aspect-video rounded-2xl overflow-hidden group ${isDark ? 'bg-[#0F172A]' : 'bg-muted-blue/90'}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-3 border-tactical-orange border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Idle State (no video loaded yet) */}
      {!src && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 font-mono text-xs gap-2">
          <Play className="w-12 h-12 text-tactical-orange/50" />
          <span>Pilih materi video untuk memulai</span>
        </div>
      )}

      {/* Controls Overlay */}
      <div className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Top bar: Chapter title */}
        {currentChapter && (
          <div className="absolute top-4 left-4 right-4 z-30">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full">
              {currentChapter}
            </span>
          </div>
        )}

        {/* Bottom controls */}
        <div className="relative p-4 space-y-3">
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="w-full h-2 bg-white/20 rounded-full cursor-pointer group/progress relative"
            onClick={seekTo}
          >
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/20 rounded-full"
              style={{ width: `${bufferedProgress}%` }}
            />
            {/* Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-tactical-orange rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            {/* Chapter markers */}
            {chapters.map((ch, i) => (
              <div
                key={i}
                className="absolute top-0 w-0.5 h-full bg-white/50"
                style={{ left: `${(ch.startTime / duration) * 100}%` }}
                title={ch.title}
              />
            ))}
            {/* Scrubber handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-tactical-orange rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>

          {/* Control buttons row */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-tactical-orange text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />}
            </button>

            {/* Restart */}
            <button onClick={restart} className="text-white/60 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Time display */}
            <span className="text-[11px] font-mono text-white/70 min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Speed control */}
            <button
              onClick={changeSpeed}
              className="text-[10px] font-bold text-white/70 hover:text-tactical-orange bg-white/10 px-2 py-1 rounded-md transition-colors"
            >
              {playbackRate}×
            </button>

            {/* Volume */}
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chapter List (collapsible below player) */}
      {chapters.length > 0 && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 max-h-[200px] overflow-y-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1 px-2">Chapters</p>
            {chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => seekToChapter(ch.startTime)}
                className={`block w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${
                  currentChapter === ch.title
                    ? 'text-tactical-orange bg-tactical-orange/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="font-mono text-white/30 mr-2">{formatTime(ch.startTime)}</span>
                {ch.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
