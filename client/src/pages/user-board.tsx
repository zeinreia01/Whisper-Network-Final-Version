import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Plus, Share2, Users, Settings, Eye, Download, Trash2, Link as LinkIcon, Pin, PinOff, User as UserIcon } from "lucide-react";
import { SpotifyTrackDisplay } from "@/components/spotify-track-display";
import { SpotifySearch } from "@/components/spotify-search";
import { UserBoardMessageViewer } from "@/components/userboard-message-viewer";
import { AdSenseContainer } from "@/components/google-adsense-modal";
import type { DashboardMessage, Admin, User } from "@shared/schema";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number | null; width: number | null }>;
  };
  external_urls: { spotify: string };
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
}

interface UserBoardProps {}

const categories = [
  { name: "Anything", color: "#6b7280" },
  { name: "Love", color: "#ef4444" },
  { name: "Advice", color: "#3b82f6" },
  { name: "Confession", color: "#8b5cf6" },
  { name: "Rant", color: "#f59e0b" },
  { name: "Reflection", color: "#10b981" },
  { name: "Writing", color: "#f97316" },
];

export default function UserBoard() {
  const [, params] = useRoute("/board/:username");
  const { user, admin } = useAuth();
  const { toast } = useToast();

  const [boardUser, setBoardUser] = useState<User | Admin | null>(null);
  const [boardMessages, setBoardMessages] = useState<DashboardMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostingMessage, setIsPostingMessage] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Anything");
  const [senderName, setSenderName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);

  // Board customization states
  const [boardName, setBoardName] = useState("");
  const [boardBanner, setBoardBanner] = useState("");

  const username = params?.username;
  const isOwnBoard = user?.username === username || admin?.username === username;

  useEffect(() => {
    if (!username) return;

    const loadUserBoard = async () => {
      setIsLoading(true);
      try {
        let profile: User | Admin | null = null;

        // Load user/admin profile
        const profileResponse = await fetch(`/api/users/profile/${username}`);
        if (profileResponse.ok) {
          profile = await profileResponse.json();
          setBoardUser(profile);
          if (profile) {
            setBoardName((profile as any).boardName || `${profile.displayName || profile.username}'s Board`);
            setBoardBanner((profile as any).boardBanner || "");
          }
        } else {
          // Try admin profile
          const adminResponse = await fetch(`/api/admins/profile/${username}`);
          if (adminResponse.ok) {
            profile = await adminResponse.json();
            setBoardUser(profile);
            if (profile) {
              setBoardName((profile as any).boardName || `${profile.displayName || profile.username}'s Board`);
              setBoardBanner((profile as any).boardBanner || "");
            }
          }
        }

        // Load board messages using the profile we just fetched
        if (profile) {
          const endpoint = 'role' in profile 
            ? `/api/admins/${profile.id}/dashboard`
            : `/api/users/${profile.id}/dashboard`;

          const messagesResponse = await fetch(endpoint);
          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            // Sort messages: pinned first, then by creation date
            const sortedMessages = messages.sort((a: DashboardMessage, b: DashboardMessage) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setBoardMessages(sortedMessages);
          }
        }
      } catch (error) {
        console.error("Error loading user board:", error);
        toast({
          title: "Error",
          description: "Failed to load user board",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserBoard();
  }, [username, toast]);

  const handlePostMessage = async () => {
    if (!messageContent.trim() || !boardUser) return;

    try {
      const messageData = {
        content: messageContent,
        category: selectedCategory,
        targetUserId: 'id' in boardUser && !('role' in boardUser) ? boardUser.id : undefined,
        targetAdminId: 'role' in boardUser ? boardUser.id : undefined,
        senderUserId: !isAnonymous && user ? user.id : undefined,
        senderAdminId: !isAnonymous && admin ? admin.id : undefined,
        senderName: isAnonymous ? (senderName || "Anonymous") : (user?.displayName || user?.username || admin?.displayName || "User"),
        isVisible: true,
        spotifyTrackId: selectedTrack?.id || undefined,
        spotifyTrackName: selectedTrack?.name || undefined,
        spotifyArtistName: selectedTrack?.artists?.map(a => a.name).join(", ") || undefined,
        spotifyAlbumCover: selectedTrack?.album?.images?.[0]?.url || undefined,
        spotifyLink: selectedTrack ? `https://open.spotify.com/track/${selectedTrack.id}` : undefined,
      };

      const response = await fetch("/api/dashboard/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setBoardMessages(prev => {
          const updated = [newMessage, ...prev];
          return updated.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
        setMessageContent("");
        setSenderName("");
        setSelectedTrack(null);
        setIsPostingMessage(false);
        toast({
          title: "Success",
          description: "Message posted to board!",
        });
      } else {
        const errorData = await response.json();
        console.error("Post error:", errorData);
        throw new Error(errorData.message || "Failed to post message");
      }
    } catch (error) {
      console.error("Error posting message:", error);
      toast({
        title: "Error",
        description: "Failed to post message",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBoard = async () => {
    if (!boardUser) return;

    try {
      const endpoint = 'role' in boardUser ? `/api/admins/${boardUser.id}/profile` : `/api/users/${boardUser.id}/profile`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardName: boardName,
          boardBanner: boardBanner,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Board updated successfully!",
        });
        setIsEditingBoard(false);
      }
    } catch (error) {
      console.error("Error updating board:", error);
      toast({
        title: "Error",
        description: "Failed to update board",
        variant: "destructive",
      });
    }
  };

  const shareBoard = async () => {
    const boardUrl = `${window.location.origin}/board/${username}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: boardName,
          text: `Check out ${boardUser?.displayName || username}'s message board!`,
          url: boardUrl,
        });
      } catch (error) {
        // Fallback to copy
        navigator.clipboard.writeText(boardUrl);
        toast({
          title: "Link Copied",
          description: "Board link copied to clipboard!",
        });
      }
    } else {
      navigator.clipboard.writeText(boardUrl);
      toast({
        title: "Link Copied",
        description: "Board link copied to clipboard!",
      });
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`/api/dashboard/messages/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        setBoardMessages(prev => prev.filter(m => m.id !== messageId));
        toast({
          title: "Success",
          description: "Message deleted successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handlePinMessage = async (messageId: number, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/messages/${messageId}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
        credentials: "include",
      });

      if (response.ok) {
        setBoardMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === messageId ? { ...msg, isPinned } : msg
          );
          return updated.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
        toast({
          title: "Success",
          description: isPinned ? "Message pinned to top" : "Message unpinned",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to pin message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error pinning message:", error);
      toast({
        title: "Error",
        description: "Failed to pin message",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!boardUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Board Not Found</h1>
            <p className="text-muted-foreground">The requested user board could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if board creation is disabled AND there are no messages (backwards compatibility)
  // If user has messages, show the board even if allowBoardCreation is false (legacy boards)
  if (!(boardUser as any).allowBoardCreation && boardMessages.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Board Not Available</h1>
            <p className="text-muted-foreground">
              {boardUser.displayName || boardUser.username} hasn't created a message board yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if board is private and user is not the owner
  if ((boardUser as any).boardVisibility === 'private' && !isOwnBoard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Board Private</h1>
            <p className="text-muted-foreground">
              This board is set to private and can only be viewed by its owner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Board Header */}
        <Card>
          <CardContent className="p-0">
            {/* Banner */}
            {(boardBanner || (boardUser as any)?.boardBanner) && (
              <div 
                className="h-48 bg-cover bg-center rounded-t-lg"
                style={{ backgroundImage: `url(${boardBanner || (boardUser as any)?.boardBanner})` }}
              />
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={boardUser.profilePicture || ""} alt={boardUser.displayName || boardUser.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                      {(boardUser.displayName || boardUser.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h1 className="text-2xl font-bold">{boardName}</h1>
                    <p className="text-muted-foreground">by {boardUser.displayName || boardUser.username}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {boardMessages.length} messages
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Button
                    onClick={() => window.location.href = `/user/${username}`}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">View Profile</span>
                    <span className="xs:hidden">Profile</span>
                  </Button>

                  <Button
                    onClick={shareBoard}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Share Board</span>
                    <span className="xs:hidden">Share</span>
                  </Button>

                  {isOwnBoard && (
                    <>
                      <Button
                        onClick={() => {
                          // Toggle board visibility
                          const newVisibility = (boardUser as any).boardVisibility === 'public' ? 'private' : 'public';
                          // This will be implemented with proper API call
                          console.log('Toggle board visibility to:', newVisibility);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        {(boardUser as any).boardVisibility === 'public' ? '🔒 Pause Board' : '🔓 Unpause Board'}
                      </Button>

                      <Dialog open={isEditingBoard} onOpenChange={setIsEditingBoard}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3">
                            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Customize</span>
                            <span className="xs:hidden">Edit</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Customize Your Board</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Board Name</label>
                            <Input
                              value={boardName}
                              onChange={(e) => setBoardName(e.target.value)}
                              placeholder="Enter board name"
                              maxLength={50}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Banner Image</label>
                            <div className="space-y-3">
                              {boardBanner && (
                                <div className="relative">
                                  <img 
                                    src={boardBanner} 
                                    alt="Banner preview" 
                                    className="w-full h-24 object-cover rounded-lg border"
                                  />
                                  <Button
                                    onClick={() => setBoardBanner("")}
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                      toast({
                                        title: "Error",
                                        description: "Image must be smaller than 2MB",
                                        variant: "destructive",
                                      });
                                      return;
                                    }

                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      const result = e.target?.result as string;
                                      setBoardBanner(result);
                                      // Update the board user state to reflect the change immediately
                                      if (boardUser) {
                                        setBoardUser(prev => prev ? { ...prev, boardBanner: result } : null);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              <p className="text-xs text-muted-foreground">
                                Upload an image (max 2MB). Recommended size: 1200x300px
                              </p>
                            </div>
                          </div>
                          <Button onClick={handleUpdateBoard} className="w-full">
                            Update Board
                          </Button>
                        </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </div>

              {boardUser.bio && (
                <p className="text-muted-foreground">{boardUser.bio}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post Message Section */}
        <Card>
          <CardContent className="p-4">
            <Button
              onClick={() => setIsPostingMessage(true)}
              className="w-full flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isOwnBoard 
                ? `Post to Your Board` 
                : `Post a Message to ${boardUser.displayName || boardUser.username}'s Board`
              }
            </Button>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Board Messages
              <Badge variant="secondary">{boardMessages.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {boardMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages on this board yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {boardMessages.map((message) => {
                  const isBoardOwnerPost = (message.senderUserId && message.senderUserId === boardUser.id) || 
                                          (message.senderAdminId && message.senderAdminId === boardUser.id);

                  // Get sender info for display
                  let senderProfile = null;
                  let displayName = message.senderName;
                  
                  if (isBoardOwnerPost) {
                    senderProfile = boardUser;
                    displayName = boardUser.displayName || boardUser.username;
                  }

                  return (
                    <div 
                      key={message.id}
                      id={`board-message-${message.id}`}
                      className={`relative bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-gray-700/40 transition-all duration-300 hover:shadow-3xl hover:border-gray-600/60 ${
                        message.isPinned ? 'ring-2 ring-yellow-400/60 ring-offset-2 ring-offset-transparent shadow-yellow-400/20' : ''
                      }`}
                      style={{
                        background: `linear-gradient(135deg, 
                          rgba(31, 41, 55, 0.9) 0%, 
                          rgba(17, 24, 39, 0.95) 50%, 
                          rgba(0, 0, 0, 0.9) 100%)`
                      }}
                    >
                      {message.isPinned && (
                        <div className="absolute -top-3 left-6 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Pin className="w-3 h-3" />
                          PINNED
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12 ring-2 ring-white/20 shadow-lg">
                              <AvatarImage src={senderProfile?.profilePicture || ""} alt={displayName} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                                {displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isBoardOwnerPost && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                                <span className="text-white text-xs">👑</span>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-lg">
                                {displayName}
                              </h3>
                              {message.senderAdminId && (
                                <Badge className="bg-purple-600/80 text-white text-xs px-2 py-1 rounded-full">
                                  🎧 Listener
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm">
                              @{isBoardOwnerPost ? boardUser.username : (message.senderUserId || message.senderAdminId ? message.senderName : 'anonymous')} • {new Date(message.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-xl p-1">
                          {isOwnBoard && (
                            <Button
                              onClick={() => handlePinMessage(message.id, !message.isPinned)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg"
                              title={message.isPinned ? "Unpin message" : "Pin message"}
                            >
                              {message.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                            </Button>
                          )}

                          <UserBoardMessageViewer
                            message={message}
                            boardUser={boardUser}
                            boardName={boardName}
                            trigger={
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg" 
                                title="Save as image"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            } 
                          />

                          {(isOwnBoard || admin) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                  title="Delete message"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 text-white border-gray-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Delete Message</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-300">
                                    Are you sure you want to delete this message? This action cannot be undone and the message will be permanently removed from your board.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete Message
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="mb-4">
                        <Badge 
                          className="px-3 py-1 text-sm font-medium rounded-full border-0"
                          style={{
                            backgroundColor: categories.find(c => c.name === message.category)?.color + '20',
                            color: categories.find(c => c.name === message.category)?.color,
                            border: `1px solid ${categories.find(c => c.name === message.category)?.color}40`
                          }}
                        >
                          {message.category}
                        </Badge>
                      </div>

                      {/* Message Content */}
                      <div className="mb-6">
                        <p 
                          className="text-gray-100 text-lg leading-relaxed font-light tracking-wide message-text"
                          style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'clip'
                          }}
                        >
                          {message.content}
                        </p>
                      </div>

                      {/* Spotify Integration */}
                      {message.spotifyTrackId && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-600/20 to-green-400/20 rounded-2xl border border-green-500/30">
                          <div className="flex items-center gap-4">
                            {message.spotifyAlbumCover && (
                              <img 
                                src={message.spotifyAlbumCover} 
                                alt="Album cover" 
                                className="w-16 h-16 rounded-xl object-cover shadow-lg ring-2 ring-green-400/30"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-lg truncate">
                                {message.spotifyTrackName}
                              </p>
                              <p className="text-green-300 text-sm truncate">
                                by {message.spotifyArtistName}
                              </p>
                            </div>
                            <a 
                              href={message.spotifyLink || `https://open.spotify.com/track/${message.spotifyTrackId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 hover:bg-green-400 text-white p-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/20"
                            >
                              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.559.3z"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Footer watermark */}
                      <div className="mt-6 pt-4 border-t border-gray-700/30">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Posted on {boardName}</span>
                          <span className="font-mono">Whisper Network</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Post Message Dialog */}
      <Dialog open={isPostingMessage} onOpenChange={setIsPostingMessage}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post to {boardName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder={isOwnBoard 
                  ? `Share an update on your board...` 
                  : `Post a Message to ${boardUser.displayName || boardUser.username}'s Board...`
                }
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="min-h-32 resize-none"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {messageContent.length}/500 characters
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Music Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Add Music (Optional)</label>
              {selectedTrack ? (
                <div className="p-3 border rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedTrack.album.images[0]?.url}
                        alt={selectedTrack.album.name}
                        className="w-10 h-10 rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">{selectedTrack.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedTrack.artists.map(a => a.name).join(", ")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTrack(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowSpotifySearch(true)}
                  className="w-full"
                >
                  🎵 Add Song from Spotify
                </Button>
              )}
            </div>

            {/* Post Type Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  Post Type
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="ml-auto"
                  />
                  <span className="text-xs text-muted-foreground">
                    {isAnonymous ? "Anonymous" : "Show Profile"}
                  </span>
                </label>
                {isAnonymous ? (
                  <div>
                    <Input
                      placeholder="Enter a name or leave empty for 'Anonymous'"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your identity will remain hidden
                    </p>
                  </div>
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
            </div>

            <div className="flex justify-end">
              <Button onClick={handlePostMessage} disabled={!messageContent.trim()}>
                Post Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spotify Search Dialog */}
      <Dialog open={showSpotifySearch} onOpenChange={setShowSpotifySearch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Search for Music</DialogTitle>
          </DialogHeader>
          <SpotifySearch
            onTrackSelect={(track) => {
              setSelectedTrack(track);
              setShowSpotifySearch(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Google AdSense Inline */}
        <div className="mt-8">
          <AdSenseContainer pageType="userboard" />
        </div>
    </div>
  );
}