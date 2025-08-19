import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SpotifySearch } from "@/components/spotify-search";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Music, Plus, Heart, MoreVertical, Trash2, Star, Play, Pause } from "lucide-react";
import type { UserMusic } from "@shared/schema";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number | null; width: number | null }>;
  };
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
}

interface UserMusicListProps {
  userId?: number;
  adminId?: number;
  isOwnProfile?: boolean;
  title?: string;
}

export function UserMusicList({ userId, adminId, isOwnProfile = false, title = "Music Collection" }: UserMusicListProps) {
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileId = userId || adminId;
  const profileType = userId ? "users" : "admins";

  // Fetch music list
  const { data: musicList = [], isLoading } = useQuery<UserMusic[]>({
    queryKey: [`/api/${profileType}/${profileId}/music`],
    enabled: !!profileId,
  });

  // Add track mutation
  const addTrackMutation = useMutation({
    mutationFn: async (track: SpotifyTrack) => {
      const response = await fetch(`/api/${profileType}/${profileId}/music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyTrackId: track.id,
          spotifyTrackName: track.name,
          spotifyArtistName: track.artists.map(a => a.name).join(", "),
          spotifyAlbumCover: track.album.images[0]?.url || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add track");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Track added to music list!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${profileType}/${profileId}/music`] });
      setIsAddingTrack(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add track to music list",
        variant: "destructive",
      });
    },
  });

  // Remove track mutation
  const removeTrackMutation = useMutation({
    mutationFn: async (musicId: number) => {
      const response = await fetch(`/api/music/${musicId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove track");
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Track removed from music list!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${profileType}/${profileId}/music`] });
    },
  });

  // Set favorite track mutation
  const setFavoriteMutation = useMutation({
    mutationFn: async (musicId: number) => {
      const response = await fetch(`/api/music/${musicId}/favorite`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to set favorite track");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Favorite track updated!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${profileType}/${profileId}/music`] });
    },
  });

  const handleSelectTrack = (track: SpotifyTrack) => {
    addTrackMutation.mutate(track);
  };

  const togglePlayPreview = async (track: UserMusic) => {
    if (playingTrack === track.spotifyTrackId) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingTrack(null);
      }
      return;
    }

    try {
      // Fetch the track details to get preview URL
      const response = await fetch(`/api/spotify/track/${track.spotifyTrackId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const trackData = await response.json();

      if (!trackData.preview_url) {
        toast({
          title: "No preview available 🎵",
          description: "This track doesn't have a 30-second preview. You can still open it in Spotify!",
        });
        return;
      }

      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio instance with proper CORS handling
      const audio = new Audio();
      
      // Set up event listeners before setting src
      audio.addEventListener('ended', () => {
        setPlayingTrack(null);
      });

      audio.addEventListener('error', (e) => {
        console.error("Audio error:", e);
        toast({
          title: "Playback error 🎵", 
          description: "Could not load this track preview. Trying alternative method...",
        });
        setPlayingTrack(null);
      });

      // Use proxied URL for better compatibility
      const proxyUrl = `/api/spotify/proxy/${encodeURIComponent(trackData.preview_url)}`;
      audio.src = proxyUrl;
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";

      await audio.play();
      audioRef.current = audio;
      setPlayingTrack(track.spotifyTrackId);

    } catch (error) {
      console.error("Error playing track:", error);
      toast({
        title: "Error playing preview",
        description: "Failed to load track preview. The song might not have a preview available.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              {title}
              <Badge variant="secondary">{musicList.length}</Badge>
            </div>
            {isOwnProfile && (
              <Button
                onClick={() => setIsAddingTrack(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Track
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {musicList.length === 0 ? (
            <div className="text-center py-8">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {isOwnProfile 
                  ? "Add your favorite songs to share your music taste"
                  : "No music added yet"}
              </p>
              {isOwnProfile && (
                <Button
                  onClick={() => setIsAddingTrack(true)}
                  size="sm"
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Track
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Show limited tracks or all tracks based on state */}
              {(showAllTracks ? musicList : musicList.slice(0, 5)).map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    track.isFavorite 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-background hover:bg-muted/50"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={track.spotifyAlbumCover || ""} alt={track.spotifyTrackName} />
                      <AvatarFallback>
                        <Music className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    {track.isFavorite && (
                      <div className="absolute -top-1 -right-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {track.spotifyTrackName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {track.spotifyArtistName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePlayPreview(track)}
                      className="w-8 h-8 p-0"
                    >
                      {playingTrack === track.spotifyTrackId ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>

                    {isOwnProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setFavoriteMutation.mutate(track.id)}
                            disabled={setFavoriteMutation.isPending}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            {track.isFavorite ? "Remove from Favorites" : "Set as Favorite"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeTrackMutation.mutate(track.id)}
                            disabled={removeTrackMutation.isPending}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Track
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
              
              {/* View More/Less Button */}
              {musicList.length > 5 && (
                <div className="flex justify-center pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllTracks(!showAllTracks)}
                    className="text-sm"
                  >
                    {showAllTracks ? 'Show Less' : `View More (${musicList.length - 5} more)`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Track Dialog */}
      <Dialog open={isAddingTrack} onOpenChange={setIsAddingTrack}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Track to Music List</DialogTitle>
          </DialogHeader>
          <SpotifySearch
            onTrackSelect={handleSelectTrack}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}