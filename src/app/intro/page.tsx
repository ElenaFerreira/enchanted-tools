"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Maximize2, Pause, Play } from "lucide-react";
import { PrimaryCTA } from "../components/PrimaryCTA";

export default function IntroPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime || 0);
  }, []);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => {
      setIsPlaying(false);
    };
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const handleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const v = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
      webkitEnterFullScreen?: () => void;
    };
    if (typeof video.requestFullscreen === "function") {
      void video.requestFullscreen();
    } else if (typeof v.webkitEnterFullscreen === "function") {
      v.webkitEnterFullscreen();
    } else if (typeof v.webkitEnterFullScreen === "function") {
      v.webkitEnterFullScreen();
    }
  }, []);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return "0:00";
    const totalSeconds = Math.max(0, Math.floor(value));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const remaining = duration - currentTime;

  const seekToPosition = useCallback(
    (clientX: number, element: HTMLDivElement) => {
      const video = videoRef.current;
      if (!video || duration <= 0) return;
      const rect = element.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.min(1, Math.max(0, x / rect.width));
      const nextTime = ratio * duration;
      video.currentTime = nextTime;
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
    <div className="flex min-h-dvh flex-col items-center py-10">
      <header className="w-full flex justify-center px-6">
        <Image src="/logo-mirokai.svg" alt="Logo Mirokaï" width={180} height={60} priority />
      </header>

      <main className="relative flex w-full flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl p-4">
          <div className="mb-4 overflow-hidden rounded-2xl relative">
            <video
              ref={videoRef}
              playsInline
              poster="/video-intro.png"
              className="h-auto w-full"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
            >
              <source src="/video.mp4" type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>

            <button
              type="button"
              aria-label="Afficher la vidéo en plein écran"
              className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
              onClick={handleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-lg font-bold text-white">La Naissance d’Enchanted Tools</p>
              <p className="font-normal text-white/80">Histoire et mythologie</p>
            </div>

            <div className="space-y-1.5">
              <div
                className="relative flex min-h-11 w-full cursor-pointer items-center touch-none"
                role="slider"
                aria-label="Position de la vidéo"
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

            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                aria-label={isPlaying ? "Mettre la vidéo en pause" : "Lire la vidéo"}
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

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <PrimaryCTA href="/onboarding/contexte" label="Continuer" ariaLabel="Passer à l’étape suivante" />
        </div>
      </main>
    </div>
  );
}
