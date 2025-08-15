import { useState } from "react";
import * as React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Eye, EyeOff, Trash2, Music } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MessageViewer } from "@/components/message-viewer";
import { categories } from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";

interface AnonymousMessage {
  id: number;
  content: string;
  category?: string;
  spotifyLink?: string;
  senderName?: string;
  recipientUserId: number | null;
  recipientAdminId: number | null;
  isRead: boolean;
  createdAt: string;
}

interface UserProfile {
  id: number;
  username: string;
  displayName?: string;
  profilePicture?: string;
  backgroundPhoto?: string;
  isAnonymousLinkPaused?: boolean;
}

export default function AnonymousMessaging() {
  const { username } = useParams<{ username: string }>();
  const [location, navigate] = useLocation();
  const { user, admin } = useAuth();
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Anything");
  const [spotifyLink, setSpotifyLink] = useState("");
  const [senderName, setSenderName] = useState("");
  const [showInbox, setShowInbox] = useState(false);
  const [isLinkPaused, setIsLinkPaused] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get recipient user profile
  const { data: recipientProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile", username],
    queryFn: async () => {
      const response = await fetch(`/api/users/profile/${username}`);
      if (!response.ok) {
        throw new Error("User not found");
      }
      return response.json();
    },
    enabled: !!username,
  });

  // Sync isLinkPaused state with profile data
  React.useEffect(() => {
    if (recipientProfile?.isAnonymousLinkPaused !== undefined) {
      setIsLinkPaused(recipientProfile.isAnonymousLinkPaused);
    }
  }, [recipientProfile?.isAnonymousLinkPaused]);

  // Get anonymous messages for authenticated user viewing their own inbox
  const { data: inboxMessages = [], isLoading: messagesLoading } = useQuery<AnonymousMessage[]>({
    queryKey: ["/api/anonymous-messages", user?.id || admin?.id],
    enabled: !!(user || admin) && showInbox,
  });

  // Send anonymous message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      content: string;
      category?: string;
      spotifyLink?: string;
      senderName?: string;
    }) => {
      const response = await fetch("/api/anonymous-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageData.content,
          category: messageData.category,
          spotifyLink: messageData.spotifyLink,
          senderName: messageData.senderName,
          recipientUserId: recipientProfile?.id,
          recipientAdminId: null, // For now, only supporting user recipients
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      setCategory("Anything");
      setSpotifyLink("");
      setSenderName("");
      toast({
        title: "Message sent!",
        description: "Your anonymous message has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/anonymous-messages"] });
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/anonymous-messages/${messageId}/read`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anonymous-messages"] });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/anonymous-messages/${messageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete message");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anonymous-messages"] });
    },
  });

  // Toggle link pause mutation
  const toggleLinkMutation = useMutation({
    mutationFn: async (isPaused: boolean) => {
      const response = await fetch(`/api/users/${recipientProfile?.id}/toggle-anonymous-link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnonymousLinkPaused: isPaused }),
      });
      if (!response.ok) throw new Error("Failed to toggle link status");
      return response.json();
    },
    onSuccess: (data) => {
      setIsLinkPaused(data.isAnonymousLinkPaused);
      // Refresh the profile data to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile", username] });
    },
  });

  const handleSendMessage = () => {
    if (!message.replace(/\s+/g, '').length || !recipientProfile) return;

    sendMessageMutation.mutate({
      content: message,
      category: category,
      spotifyLink: spotifyLink || undefined,
      senderName: senderName || undefined,
    });
  };

  const handleMarkAsRead = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  };

  const handleDeleteMessage = (messageId: number) => {
    deleteMessageMutation.mutate(messageId);
  };

  const isOwnProfile = (user && recipientProfile && user.username === recipientProfile.username) ||
                      (admin && recipientProfile && admin.username === recipientProfile.username);

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!recipientProfile) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert>
          <AlertDescription>
            User not found. Please check the username and try again.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/")} className="mt-4">
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        {/* Background Photo */}
        {recipientProfile.backgroundPhoto && (
          <div 
            className="h-48 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${recipientProfile.backgroundPhoto})` }}
          >
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        )}

        <CardHeader className={`text-center ${recipientProfile.backgroundPhoto ? "-mt-16 relative z-10" : ""}`}>
          <div className="flex justify-center mb-4">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarImage 
                src={recipientProfile.profilePicture || undefined} 
                alt={recipientProfile.displayName || recipientProfile.username}
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-bold">
                {(recipientProfile.displayName || recipientProfile.username)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className={`text-2xl ${recipientProfile.backgroundPhoto ? 'text-white' : ''}`}>
            {recipientProfile.displayName || recipientProfile.username}
          </CardTitle>
          <CardDescription className={recipientProfile.backgroundPhoto ? 'text-gray-200' : ''}>
            Send an anonymous message to @{recipientProfile.username}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Show inbox toggle for own profile */}
      {isOwnProfile && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setShowInbox(!showInbox)}
            className="flex items-center gap-2"
          >
            {showInbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showInbox ? "Hide Inbox" : "View My Anonymous Messages"}
          </Button>
        </div>
      )}

      {/* Anonymous Messages Inbox */}
      {showInbox && isOwnProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Your Anonymous Messages
            </CardTitle>
            <CardDescription>
              Messages sent to you anonymously
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messagesLoading ? (
              <div className="text-center py-4">Loading messages...</div>
            ) : inboxMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No anonymous messages yet
              </div>
            ) : (
              inboxMessages.map((msg) => (
                <Card key={msg.id} className={`${!msg.isRead ? "ring-2 ring-purple-200" : ""}`}>
                  <CardContent className="p-4">
                    {/* Message content */}
                    <p className="mb-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{msg.content}</p>

                    {/* Category, sender name, and spotify link */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {msg.category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {msg.category}
                        </span>
                      )}
                      {msg.senderName && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          From: {msg.senderName}
                        </span>
                      )}
                      {msg.spotifyLink && (
                        <a 
                          href={msg.spotifyLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          <Music className="h-3 w-3 mr-1" />
                          🎵 Spotify Track
                        </a>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                      <div className="flex gap-2">
                        <MessageViewer 
                          message={{
                            id: msg.id,
                            content: msg.content,
                            createdAt: new Date(msg.createdAt),
                            senderName: msg.senderName || "Anonymous",
                            category: msg.category || "Anything",
                            spotifyLink: msg.spotifyLink || null,
                            recipient: recipientProfile.username,
                            reactionCount: 0,
                            replies: [],
                            isPublic: false,
                            userId: null,
                            adminId: null,
                            isAuthenticated: false,
                            isOwnerPrivate: false
                          }}
                          trigger={
                            <Button size="sm" variant="outline" className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              View Whisper
                            </Button>
                          }
                        />
                        {!msg.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(msg.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Send Message Form */}
      {!isOwnProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Anonymous Message
            </CardTitle>
            <CardDescription className={`text-center ${recipientProfile.backgroundPhoto ? 'text-gray-200' : ''}`}>
              Send an anonymous message to @{recipientProfile.username}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLinkPaused ? (
              <div className="p-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Anonymous Messages Paused</h3>
                <p className="text-gray-600">
                  @{recipientProfile.username} has temporarily paused their anonymous messaging. 
                  Please check back later or try reaching out through other means.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your anonymous message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">
                      {message.length}/500 characters
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="senderName">Your Name (Optional)</Label>
                  <Input
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Leave blank to remain anonymous"
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="spotify" className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Spotify Track (Optional)
                  </Label>
                  <Input
                    id="spotify"
                    type="url"
                    value={spotifyLink}
                    onChange={(e) => setSpotifyLink(e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendMessageMutation.isPending ? "Sending..." : "Send Anonymously"}
                  </Button>
                </div>
              </div>
            )}

            {sendMessageMutation.isSuccess && (
              <Alert>
                <AlertDescription>
                  Your anonymous message has been sent successfully!
                </AlertDescription>
              </Alert>
            )}

            {sendMessageMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to send message. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Share Your Link */}
      {isOwnProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Share Your Anonymous Link
              <Button
                onClick={() => toggleLinkMutation.mutate(!isLinkPaused)}
                variant={isLinkPaused ? "default" : "outline"}
                size="sm"
                className={isLinkPaused ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isLinkPaused ? "Resume Link" : "Pause Link"}
              </Button>
            </CardTitle>
            <CardDescription>
              {isLinkPaused 
                ? "Your anonymous link is paused - no new messages can be sent" 
                : "Share this link to receive anonymous messages"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/u/${recipientProfile.username}`}
                readOnly
                className={`flex-1 p-2 border rounded text-sm ${isLinkPaused ? 'bg-gray-100 text-gray-500' : 'bg-muted'}`}
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/u/${recipientProfile.username}`);
                }}
                variant="outline"
                disabled={isLinkPaused}
              >
                Copy Link
              </Button>
            </div>
            {isLinkPaused && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  🔒 Your anonymous messaging is currently paused. Resume it to start receiving new messages again.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}