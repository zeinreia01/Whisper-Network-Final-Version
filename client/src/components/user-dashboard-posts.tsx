import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SpotifySearch } from "@/components/spotify-search";
import { SpotifyTrackDisplay } from "@/components/spotify-track-display";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Plus, Music, X, Download, Eye } from "lucide-react";
import html2canvas from "html2canvas";
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
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, admin } = useAuth();

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
        senderName: isAnonymous ? (senderName || "Anonymous") : (user?.displayName || user?.username || admin?.displayName || "User"),
        senderUserId: !isAnonymous && user ? user.id : undefined,
        senderAdminId: !isAnonymous && admin ? admin.id : undefined,
        targetUserId: userId || undefined,
        targetAdminId: adminId || undefined,
        spotifyTrackId: selectedTrack?.id || undefined,
        spotifyTrackName: selectedTrack?.name || undefined,
        spotifyArtistName: selectedTrack?.artists.map(a => a.name).join(", ") || undefined,
        spotifyAlbumCover: selectedTrack?.album.images[0]?.url || undefined,
        spotifyLink: selectedTrack ? `https://open.spotify.com/track/${selectedTrack.id}` : undefined,
      };

      const response = await fetch("/api/dashboard/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to post message:", errorText);
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
      setIsAnonymous(true);
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

  const downloadMessageAsImage = async (messageElement: HTMLElement, messageId: number) => {
    try {
      const canvas = await html2canvas(messageElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = `board-message-${messageId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "Success",
        description: "Message downloaded as image!",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error", 
        description: "Failed to download image",
        variant: "destructive",
      });
    }
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
              {(showAllMessages ? dashboardMessages : dashboardMessages.slice(0, 2)).map((message) => (
                <div
                  key={message.id}
                  id={`board-message-${message.id}`}
                  className="p-4 rounded-lg border bg-background relative group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Sender Avatar */}
                      {message.senderUserId || message.senderAdminId ? (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={""} alt={message.senderName} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                            {message.senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gray-400 text-white text-sm">
                            ?
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {message.senderName}
                          </span>
                          {message.senderUserId && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              User
                            </Badge>
                          )}
                          {message.senderAdminId && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-purple-50 border-purple-200 text-purple-700">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <Badge 
                          variant="outline"
                          className="w-fit text-xs"
                          style={{ 
                            backgroundColor: categories.find(c => c.name === message.category)?.color + '20',
                            borderColor: categories.find(c => c.name === message.category)?.color 
                          }}
                        >
                          {message.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(new Date(message.createdAt))}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const messageElement = document.getElementById(`board-message-${message.id}`);
                          if (messageElement) {
                            downloadMessageAsImage(messageElement, message.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
                        title="Download as image"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed mb-3">
                    {message.content}
                  </p>

                  {message.spotifyTrackId && (
                    <div className="mt-3">
                      <SpotifyTrackDisplay
                        track={{
                          id: message.spotifyTrackId,
                          name: message.spotifyTrackName || "",
                          artists: [{ id: "stored", name: message.spotifyArtistName || "" }],
                          album: {
                            id: "stored",
                            name: "Unknown Album",
                            images: message.spotifyAlbumCover ? [{ url: message.spotifyAlbumCover, height: null, width: null }] : [],
                          },
                          external_urls: {
                            spotify: message.spotifyLink || `https://open.spotify.com/track/${message.spotifyTrackId}`,
                          },
                          preview_url: null,
                          duration_ms: 0,
                          popularity: 0,
                        }}
                        size="sm"
                        showPreview={true}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {dashboardMessages.length > 2 && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllMessages(!showAllMessages)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {showAllMessages ? `Show Less (${Math.min(2, dashboardMessages.length)})` : `View All ${dashboardMessages.length} Messages`}
                  </Button>
                </div>
              )}
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
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                Post Type
                <Switch
                  checked={!isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(!checked)}
                />
                <span className="text-xs text-muted-foreground">
                  {isAnonymous ? "Anonymous" : "Show Profile"}
                </span>
              </label>
              {isAnonymous ? (
                <Input
                  placeholder="Enter a name or leave empty for 'Anonymous'"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  maxLength={50}
                />
              ) : (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    Posting as: <strong>{user?.displayName || user?.username || admin?.displayName || "User"}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your profile and username will be visible
                  </p>
                </div>
              )}
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
                    track={selectedTrack}
                    size="sm"
                    showPreview={true}
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