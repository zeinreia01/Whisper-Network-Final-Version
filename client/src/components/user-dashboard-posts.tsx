import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
import { MessageSquare, Plus, Music, X, Download, Eye, Trash2, MoreVertical } from "lucide-react";
import html2canvas from "html2canvas";
import { categories } from "@/lib/categories";
import { formatTimeAgo } from "@/lib/utils";
import { Link } from "wouter";
import type { DashboardMessage } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageViewer } from "@/components/message-viewer";


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

  const handleDeleteMessage = (messageId: number) => {
    // Placeholder for actual delete logic
    console.log(`Deleting message with ID: ${messageId}`);
    toast({
      title: "Success",
      description: "Message deleted.",
    });
    queryClient.invalidateQueries({ queryKey: [`/api/${profileType}/${profileId}/dashboard`] });
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
            <Button
                onClick={() => setIsPostingMessage(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isOwnProfile
                  ? `Post to Your Board`
                  : `Post Message to ${username}'s Board`
                }
              </Button>
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
              {isOwnProfile && (
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
                  className="bg-gray-900 text-white rounded-2xl p-6 relative group hover:bg-gray-800 transition-colors duration-200"
                >
                  {/* Header with user info and timestamp */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Profile Avatar */}
                      {message.userId && (
                        <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-800 shadow-lg">
                          <AvatarImage 
                            src={message.user?.profilePicture || undefined} 
                            alt={message.user?.displayName || message.user?.username || 'User'}
                          />
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {(message.user?.displayName || message.user?.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {message.adminId && (
                        <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-800 shadow-lg">
                          <AvatarImage 
                            src={message.admin?.profilePicture || undefined} 
                            alt={message.admin?.displayName || 'Admin'}
                          />
                          <AvatarFallback className="bg-purple-600 text-white text-sm">
                            {(message.admin?.displayName || 'A').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-base">
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
                          {/* Board Owner Tag */}
                          {((message.senderUserId && message.senderUserId === userId) ||
                            (message.senderAdminId && message.senderAdminId === adminId)) && (
                            <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-green-500 text-white">
                              Board Owner
                            </Badge>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">
                          @{username}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm">
                        {(() => {
                          const now = new Date();
                          const messageDate = new Date(message.createdAt);
                          const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

                          if (diffInDays === 0) return 'today';
                          if (diffInDays === 1) return '1d';
                          if (diffInDays < 7) return `${diffInDays}d`;
                          if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
                          return `${Math.floor(diffInDays / 30)}mo`;
                        })()}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                          <MessageViewer
                            message={{
                              ...message,
                              isPublic: false,
                              recipient: username,
                              userId: message.senderUserId || null,
                              adminId: message.senderAdminId || null,
                              isAuthenticated: Boolean(message.senderUserId || message.senderAdminId),
                              isOwnerPrivate: false,
                              isPinned: message.isPinned || false,
                              replies: [],
                              user: message.senderUserId ? {
                                id: message.senderUserId,
                                username: message.senderName,
                                password: "",
                                displayName: message.senderName,
                                profilePicture: null,
                                backgroundPhoto: null,
                                bio: null,
                                boardName: null,
                                boardBanner: null,
                                lastDisplayNameChange: null,
                                isVerified: false,
                                likedMessagesPrivacy: "private",
                                isAnonymousLinkPaused: false,
                                createdAt: new Date(),
                                isActive: true,
                                spotifyTrackId: null,
                                spotifyTrackName: null,
                                spotifyArtistName: null,
                                spotifyAlbumCover: null,
                              } : null,
                              admin: message.senderAdminId ? {
                                id: message.senderAdminId,
                                username: message.senderName,
                                password: null,
                                displayName: message.senderName,
                                profilePicture: null,
                                backgroundPhoto: null,
                                bio: null,
                                role: "admin",
                                isVerified: false,
                                lastDisplayNameChange: null,
                                createdAt: new Date(),
                                isActive: true,
                                spotifyTrackId: null,
                                spotifyTrackName: null,
                                spotifyArtistName: null,
                                spotifyAlbumCover: null,
                              } : null,
                            }}
                            trigger={
                              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                                <Download className="h-4 w-4 mr-2" />
                                Download as Image
                              </DropdownMenuItem>
                            }
                          />
                          {(isOwnProfile || (user && user.id === userId)) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-400 hover:text-red-300 hover:bg-gray-700">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Message
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Message</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this message? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="mb-4">
                    <p className="text-white leading-relaxed text-base">
                      {message.content}
                    </p>
                  </div>

                  {/* Category Badge */}
                  <div className="mb-4">
                    <span
                      className="inline-block text-xs px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${categories.find(c => c.name === message.category)?.color}20`,
                        color: categories.find(c => c.name === message.category)?.color,
                        border: `1px solid ${categories.find(c => c.name === message.category)?.color}30`,
                      }}
                    >
                      {message.category}
                    </span>
                  </div>

                  {/* Spotify Track Display */}
                  {message.spotifyTrackId && (
                    <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3">
                        {message.spotifyAlbumCover && (
                          <img
                            src={message.spotifyAlbumCover}
                            alt="Album cover"
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">
                            {message.spotifyTrackName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {message.spotifyArtistName}
                          </p>
                        </div>
                        <a
                          href={message.spotifyLink || `https://open.spotify.com/track/${message.spotifyTrackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-400 transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.559.3z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="text-center pt-4 space-y-2">
                <Link href={`/board/${username}`}>
                  <Button variant="default" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    View Full Board ({dashboardMessages.length} messages)
                  </Button>
                </Link>
                {dashboardMessages.length > 2 && (
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setShowAllMessages(!showAllMessages)}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Eye className="w-4 h-4" />
                      {showAllMessages ? `Show Less (2)` : `Show All ${dashboardMessages.length} Here`}
                    </Button>
                  </div>
                )}
              </div>
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
              <label className="text-sm font-medium mb-2 block flex items-center gap-2" data-tour-anonymous-link>
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