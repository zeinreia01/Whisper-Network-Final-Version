// Utility functions for Spotify integration

/**
 * Extracts track ID from various Spotify URL formats
 */
export function extractSpotifyTrackId(url: string): string | null {
  if (!url) return null;
  
  // Handle different Spotify URL formats:
  // https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
  // https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc123
  // spotify:track:4uLU6hMCjMI75M1A2tKUQC
  
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify:track:([a-zA-Z0-9]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Generates a simple song title from a Spotify URL
 * Since we can't access Spotify API without keys, we'll create a fallback
 */
export function getSpotifyDisplayName(url: string): string {
  const trackId = extractSpotifyTrackId(url);
  
  if (!trackId) {
    return "🎵 Music attached";
  }
  
  // For now, return a generic but more appealing name
  // In a real implementation, you'd fetch from Spotify API
  return "🎵 Spotify Track";
}

/**
 * Check if a URL is a valid Spotify link
 */
export function isValidSpotifyUrl(url: string): boolean {
  return extractSpotifyTrackId(url) !== null;
}