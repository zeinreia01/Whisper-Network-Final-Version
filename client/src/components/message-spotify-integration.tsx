import React from "react";
import { SpotifyTrackDisplay } from "./spotify-track-display";
import { useQuery } from "@tanstack/react-query";

interface MessageSpotifyIntegrationProps {
  spotifyTrackId?: string | null;
  spotifyTrackName?: string | null;
  spotifyArtistName?: string | null;
  spotifyAlbumCover?: string | null;
  spotifyLink?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MessageSpotifyIntegration({
  spotifyTrackId,
  spotifyTrackName,
  spotifyArtistName,
  spotifyAlbumCover,
  spotifyLink,
  size = "sm",
  className
}: MessageSpotifyIntegrationProps) {
  // If we have stored track data, use it directly
  const hasStoredTrackData = spotifyTrackId && spotifyTrackName && spotifyArtistName;
  
  // If we only have a Spotify link, try to extract track ID and fetch details
  const extractedTrackId = React.useMemo(() => {
    if (hasStoredTrackData || !spotifyLink) return null;
    
    const patterns = [
      /spotify:track:([a-zA-Z0-9]{22})/,
      /open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/,
      /spotify\.com\/track\/([a-zA-Z0-9]{22})/,
    ];

    for (const pattern of patterns) {
      const match = spotifyLink.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }, [spotifyLink, hasStoredTrackData]);

  const { data: fetchedTrack } = useQuery({
    queryKey: ["/api/spotify/track", extractedTrackId],
    queryFn: async () => {
      if (!extractedTrackId) return null;
      
      const response = await fetch(`/api/spotify/track/${extractedTrackId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch track details");
      }
      return response.json();
    },
    enabled: !!extractedTrackId && !hasStoredTrackData,
  });

  // Create track object from stored data or fetched data
  const track = React.useMemo(() => {
    if (hasStoredTrackData) {
      return {
        id: spotifyTrackId,
        name: spotifyTrackName,
        artists: [{ id: "stored", name: spotifyArtistName }],
        album: {
          id: "stored",
          name: "Unknown Album",
          images: spotifyAlbumCover ? [{ url: spotifyAlbumCover, height: null, width: null }] : [],
        },
        external_urls: {
          spotify: spotifyLink || `https://open.spotify.com/track/${spotifyTrackId}`,
        },
        preview_url: null, // Will be fetched if needed
        duration_ms: 0,
        popularity: 0,
      };
    }
    
    if (fetchedTrack) {
      return fetchedTrack;
    }
    
    return null;
  }, [hasStoredTrackData, spotifyTrackId, spotifyTrackName, spotifyArtistName, spotifyAlbumCover, spotifyLink, fetchedTrack]);

  // Don't render anything if no track data is available
  if (!track) {
    return null;
  }

  return (
    <div className={`mt-3 ${className}`}>
      <SpotifyTrackDisplay 
        track={track} 
        size={size} 
        showPreview={true}
        className="border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
      />
    </div>
  );
}