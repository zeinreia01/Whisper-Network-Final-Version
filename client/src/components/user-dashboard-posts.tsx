import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpotifySearch } from "@/components/spotify-search";
import { SpotifyTrackDisplay } from "@/components/spotify-track-display";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Music, X } from "lucide-react";
import { categories } from "@/lib/categories";
import { formatTimeAgo } from "@/lib/utils";
import type { DashboardMessage } from "@shared/schema";

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

interface UserDashboardPostsProps {
  userId?: number;
  adminId?: number;
  username?: string;
  isOwnProfile?: boolean;
}

export function UserDashboardPosts({ userId, adminId, username, isOwnProfile = false }: UserDashboardPostsProps) {
  const [isPostingMessage, setIsPostingMessage] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [senderName, setSenderName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Anything");
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileId = userId || adminId;
  const profileType = userId ? "users" : "admins";

  // Fetch dashboard messages
  const { data: dashboardMessages = [], isLoading } = useQuery<DashboardMessage[]>({
    queryKey: [`/api/${profileType}/${profileId}/dashboard`],
    enabled: !!profileId,
  });

  // Post message mutation
  const postMessageMutation = useMutation({
    mutationFn: async () => {
      const messageData = {
        content: messageContent,
        category: selectedCategory,
        senderName: senderName || "Anonymous",
        targetUserId: userId || null,
        targetAdminId: adminId || null,
        spotifyTrackId: selectedTrack?.id || null,
        spotifyTrackName: selectedTrack?.name || null,
        spotifyArtistName: selectedTrack?.artists.map(a => a.name).join(", ") || null,
        spotifyAlbumCover: selectedTrack?.album.images[0]?.url || null,
        spotifyLink: selectedTrack ? `https://open.spotify.com/track/${selectedTrack.id}` : null,
      };

      const response = await fetch("/api/dashboard/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error("Failed to post message");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Message posted to ${username}'s board!`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${profileType}/${profileId}/dashboard`] });
      setIsPostingMessage(false);
      setMessageContent("");
      setSenderName("");
      setSelectedCategory("Anything");
      setSelectedTrack(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post message",
        variant: "destructive",
      });
    },
  });

  const handleSelectTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setShowSpotifySearch(false);
  };

  const removeSelectedTrack = () => {
    setSelectedTrack(null);
  };

  const handlePostMessage = () => {
    if (!messageContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    postMessageMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Sent Posts To {username}
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
              <MessageSquare className="w-5 h-5" />
              Sent Posts To {username}
              <Badge variant="secondary">{dashboardMessages.length}</Badge>
            </div>
            {!isOwnProfile && (
              <Button
                onClick={() => setIsPostingMessage(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post Message to {username}'s Board
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {isOwnProfile 
                  ? "No messages have been posted to your board yet"
                  : `No messages posted to ${username}'s board yet`}
              </p>
              {!isOwnProfile && (
                <Button
                  onClick={() => setIsPostingMessage(true)}
                  size="sm"
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Be the First to Post
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 rounded-lg border bg-background"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: categories.find(c => c.name === message.category)?.color + '20',
                          borderColor: categories.find(c => c.name === message.category)?.color 
                        }}
                      >
                        {message.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        by {message.senderName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(new Date(message.createdAt))}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed mb-3">
                    {message.content}
                  </p>

                  {message.spotifyTrackId && (
                    <div className="mt-3">
                      <SpotifyTrackDisplay
                        trackId={message.spotifyTrackId}
                        trackName={message.spotifyTrackName || ""}
                        artistName={message.spotifyArtistName || ""}
                        albumCover={message.spotifyAlbumCover || ""}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Message Dialog */}
      <Dialog open={isPostingMessage} onOpenChange={setIsPostingMessage}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Message to {username}'s Board</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Name (Optional)</label>
              <Input
                placeholder="Leave empty to post anonymously"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder={`Write your message to ${username}...`}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <div className="text-right text-xs text-muted-foreground mt-1">
                {messageContent.length}/500
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Add Music (Optional)</label>
              {selectedTrack ? (
                <div className="relative">
                  <SpotifyTrackDisplay
                    trackId={selectedTrack.id}
                    trackName={selectedTrack.name}
                    artistName={selectedTrack.artists.map(a => a.name).join(", ")}
                    albumCover={selectedTrack.album.images[0]?.url || ""}
                    size="sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedTrack}
                    className="absolute top-2 right-2 w-6 h-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowSpotifySearch(true)}
                  className="w-full flex items-center gap-2"
                >
                  <Music className="w-4 h-4" />
                  Search for a Song
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPostingMessage(false)}
              disabled={postMessageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostMessage}
              disabled={postMessageMutation.isPending || !messageContent.trim()}
            >
              {postMessageMutation.isPending ? "Posting..." : "Post Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spotify Search Dialog */}
      <Dialog open={showSpotifySearch} onOpenChange={setShowSpotifySearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search for a Song</DialogTitle>
          </DialogHeader>
          <SpotifySearch onTrackSelect={handleSelectTrack} />
        </DialogContent>
      </Dialog>
    </>
  );
}