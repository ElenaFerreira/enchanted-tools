"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface AudioPlayerCardProps {
  title?: string;
  subtitle?: string;
  src: string;
  onEnded?: () => void;
}

export function AudioPlayerCard({ title, subtitle, src, onEnded }: AudioPlayerCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration || 0);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime || 0);
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused || audio.ended) {
      void audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const ended = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    audio.addEventListener("ended", ended);
    return () => audio.removeEventListener("ended", ended);
  }, [onEnded]);

  const progress = useMemo(() => (duration > 0 ? Math.min(1, currentTime / duration) : 0), [currentTime, duration]);
  const remaining = Math.max(0, duration - currentTime);

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return "0:00";
    const totalSeconds = Math.max(0, Math.floor(value));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const seekToPosition = useCallback(
    (clientX: number, element: HTMLDivElement) => {
      const audio = audioRef.current;
      if (!audio || duration <= 0) return;
      const rect = element.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.min(1, Math.max(0, x / rect.width));
      const nextTime = ratio * duration;
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration],
  );

  const handleSeekClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      seekToPosition(event.clientX, event.currentTarget);
    },
    [seekToPosition],
  );

  const handleSeekTouch = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const touch = event.changedTouches[0] ?? event.touches[0];
      if (!touch) return;
      event.preventDefault();
      seekToPosition(touch.clientX, event.currentTarget);
    },
    [seekToPosition],
  );

  return (
    <div className="w-full">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      >
        <source src={src} />
        Votre navigateur ne supporte pas la lecture audio.
      </audio>

      <div className="space-y-2">
        {(title || subtitle) && (
          <div>
            {title ? <p className="text-lg font-bold text-white">{title}</p> : null}
            {subtitle ? <p className="font-normal text-white/80">{subtitle}</p> : null}
          </div>
        )}

        <div className="space-y-1.5">
          <div
            className="relative flex min-h-11 w-full cursor-pointer items-center touch-none"
            role="slider"
            aria-label="Position de l’audio"
            aria-valuemin={0}
            aria-valuemax={duration || 0}
            aria-valuenow={currentTime}
            onClick={handleSeekClick}
            onTouchEnd={handleSeekTouch}
          >
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div className="h-1.5 rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-white/60">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remaining)}</span>
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-center">
          <button
            type="button"
            aria-label={isPlaying ? "Mettre l’audio en pause" : "Lire l’audio"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-900"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-current" strokeWidth={0} />
            ) : (
              <Play className="h-6 w-6 pl-0.5 fill-current" strokeWidth={0} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

