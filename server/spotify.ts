import { z } from "zod";

// Spotify API types and schemas
export const SpotifyTrack = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  album: z.object({
    id: z.string(),
    name: z.string(),
    images: z.array(z.object({
      url: z.string(),
      height: z.number().nullable(),
      width: z.number().nullable(),
    })),
  }),
  external_urls: z.object({
    spotify: z.string(),
  }),
  preview_url: z.string().nullable(),
  duration_ms: z.number(),
  popularity: z.number(),
});

export const SpotifySearchResponse = z.object({
  tracks: z.object({
    items: z.array(SpotifyTrack),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type SpotifyTrackType = z.infer<typeof SpotifyTrack>;
export type SpotifySearchResponseType = z.infer<typeof SpotifySearchResponse>;

class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID!;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error("Spotify credentials not found in environment variables");
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Get new access token using Client Credentials flow
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to get Spotify access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

    console.log('Got new Spotify access token');
    return this.accessToken!;
  }

  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrackType[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const accessToken = await this.getAccessToken();
      const encodedQuery = encodeURIComponent(query);
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify search failed: ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = SpotifySearchResponse.parse(data);
      return validatedData.tracks.items;
    } catch (error) {
      console.error('Spotify search error:', error);
      throw new Error('Failed to search Spotify tracks');
    }
  }

  async getTrack(trackId: string): Promise<SpotifyTrackType | null> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get track: ${response.statusText}`);
      }

      const data = await response.json();
      return SpotifyTrack.parse(data);
    } catch (error) {
      console.error('Get track error:', error);
      return null;
    }
  }

  // Extract Spotify track ID from various URL formats
  extractSpotifyTrackId(url: string): string | null {
    const patterns = [
      /spotify:track:([a-zA-Z0-9]{22})/,
      /open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/,
      /spotify\.com\/track\/([a-zA-Z0-9]{22})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Check if a URL is a Spotify track URL
  isSpotifyUrl(url: string): boolean {
    return this.extractSpotifyTrackId(url) !== null;
  }
}

export const spotifyAPI = new SpotifyAPI();