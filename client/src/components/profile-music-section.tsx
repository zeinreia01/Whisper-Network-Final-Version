import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Plus, Edit2, X } from "lucide-react";
import { SpotifySearch } from "./spotify-search";
import { SpotifyTrackDisplay } from "./spotify-track-display";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

interface User {
  id: number;
  spotifyTrackId?: string | null;
  spotifyTrackName?: string | null;
  spotifyArtistName?: string | null;
  spotifyAlbumCover?: string | null;
}

interface Admin {
  id: number;
  spotifyTrackId?: string | null;
  spotifyTrackName?: string | null;
  spotifyArtistName?: string | null;
  spotifyAlbumCover?: string | null;
}

interface ProfileMusicSectionProps {
  user?: User | null;
  admin?: Admin | null;
  isOwnProfile?: boolean;
  title?: string;
}

export function ProfileMusicSection({ user, admin, isOwnProfile = false, title }: ProfileMusicSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileData = user || admin;
  const profileType = user ? "user" : "admin";

  // Convert stored track data to SpotifyTrack format for display
  const currentTrack: SpotifyTrack | null = profileData?.spotifyTrackId ? {
    id: profileData.spotifyTrackId,
    name: profileData.spotifyTrackName || "Unknown Track",
    artists: [{ id: "unknown", name: profileData.spotifyArtistName || "Unknown Artist" }],
    album: {
      id: "unknown",
      name: "Unknown Album",
      images: profileData.spotifyAlbumCover ? [{ url: profileData.spotifyAlbumCover, height: null, width: null }] : [],
    },
    external_urls: {
      spotify: `https://open.spotify.com/track/${profileData.spotifyTrackId}`,
    },
    preview_url: null,
    duration_ms: 0,
    popularity: 0,
  } : null;

  const updateMusicMutation = useMutation({
    mutationFn: async (trackData: SpotifyTrack | null) => {
      if (!profileData) throw new Error("Profile not found");

      const endpoint = profileType === "user" 
        ? `/api/users/${profileData.id}/spotify`
        : `/api/admins/${profileData.id}/spotify`;

      const payload = trackData ? {
        spotifyTrackId: trackData.id,
        spotifyTrackName: trackData.name,
        spotifyArtistName: trackData.artists.map(a => a.name).join(", "),
        spotifyAlbumCover: trackData.album.images[0]?.url || null,
      } : {
        spotifyTrackId: null,
        spotifyTrackName: null,
        spotifyArtistName: null,
        spotifyAlbumCover: null,
      };

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile song");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: selectedTrack ? "Profile song updated!" : "Profile song removed!",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/${profileType}s/${profileData?.id}/profile`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      
      setIsEditing(false);
      setSelectedTrack(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile song",
        variant: "destructive",
      });
    },
  });

  const handleSaveTrack = () => {
    updateMusicMutation.mutate(selectedTrack);
  };

  const handleRemoveTrack = () => {
    updateMusicMutation.mutate(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedTrack(null);
  };

  if (!isOwnProfile && !currentTrack) {
    return null; // Don't show empty music section for other users
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music className="w-5 h-5" />
          {title || "Profile Song"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-4">
            <SpotifySearch
              onTrackSelect={setSelectedTrack}
              selectedTrack={selectedTrack}
              placeholder="Search for a song to add to your profile..."
            />
            
            <div className="flex gap-2">
              <Button
                onClick={handleSaveTrack}
                disabled={updateMusicMutation.isPending}
                size="sm"
              >
                {updateMusicMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                size="sm"
                disabled={updateMusicMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {currentTrack ? (
              <div className="space-y-3">
                <SpotifyTrackDisplay track={currentTrack} size="md" />
                {isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Change Song
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveTrack}
                      disabled={updateMusicMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              isOwnProfile && (
                <div className="text-center py-6">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a song to your profile to share your music taste
                  </p>
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Profile Song
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}