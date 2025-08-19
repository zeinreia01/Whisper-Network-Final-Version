import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ExternalLink, Play, Pause } from "lucide-react";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number | null;
      width: number | null;
    }>;
  };
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
}

interface SpotifyTrackDisplayProps {
  track: SpotifyTrack | null;
  showPreview?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SpotifyTrackDisplay({ track, size = "md", showPreview = true, className }: SpotifyTrackDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track?.preview_url) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [track?.preview_url]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !track?.preview_url) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  const getAlbumArt = (track: SpotifyTrack) => {
    const sizeMap = {
      sm: 300,
      md: 640,
      lg: 640,
    };

    const targetSize = sizeMap[size];
    const image = track.album.images.find(img => img.height && img.height <= targetSize) || track.album.images[0];
    return image?.url;
  };

  const sizeClasses = {
    sm: {
      container: "p-3",
      image: "w-10 h-10",
      title: "text-sm",
      artist: "text-xs",
      icon: "w-4 h-4",
    },
    md: {
      container: "p-4",
      image: "w-12 h-12",
      title: "text-sm",
      artist: "text-sm",
      icon: "w-4 h-4",
    },
    lg: {
      container: "p-6",
      image: "w-16 h-16",
      title: "text-base",
      artist: "text-sm",
      icon: "w-5 h-5",
    },
  };

  const classes = sizeClasses[size];
  const albumArt = getAlbumArt(track);

  return (
    <Card className={`bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800 ${className}`}>
      <CardContent className={classes.container}>
        <div className="flex items-center gap-3">
          {/* Album Art or Music Icon */}
          {albumArt ? (
            <img
              src={albumArt}
              alt={`${track.album.name} album art`}
              className={`${classes.image} rounded object-cover`}
            />
          ) : (
            <div className={`${classes.image} bg-green-100 dark:bg-green-900 rounded flex items-center justify-center`}>
              <Music className={`${classes.icon} text-green-600 dark:text-green-400`} />
            </div>
          )}

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${classes.title}`}>
              {track.name}
            </p>
            <p className={`text-muted-foreground truncate ${classes.artist}`}>
              {track.artists.map(artist => artist.name).join(", ")}
            </p>
            {size !== "sm" && (
              <p className="text-xs text-muted-foreground truncate">
                {track.album.name} • {formatDuration(track.duration_ms)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {showPreview && track.preview_url && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                {duration > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formatTime(currentTime)}/{formatTime(duration)}
                  </span>
                )}
                <audio
                  ref={audioRef}
                  src={track.preview_url}
                  preload="metadata"
                />
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(track.external_urls.spotify, '_blank')}
              className="p-2"
              title="Open in Spotify"
            >
              <ExternalLink className={classes.icon} />
            </Button>
          </div>
        </div>

        {/* Spotify Badge */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Music className="w-3 h-3" />
            <span>Spotify</span>
          </div>
          {size === "lg" && (
            <div className="text-xs text-muted-foreground">
              Popularity: {track.popularity}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}