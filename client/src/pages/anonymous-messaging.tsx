import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Send, Eye, EyeOff, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MessageViewer } from "@/components/message-viewer";

interface AnonymousMessage {
  id: number;
  content: string;
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
}

export default function AnonymousMessaging() {
  const { username } = useParams<{ username: string }>();
  const [location, navigate] = useLocation();
  const { user, admin } = useAuth();
  const [message, setMessage] = useState("");
  const [showInbox, setShowInbox] = useState(false);
  const [isLinkPaused, setIsLinkPaused] = useState(false);
  const queryClient = useQueryClient();

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

  // Get anonymous messages for authenticated user viewing their own inbox
  const { data: inboxMessages = [], isLoading: messagesLoading } = useQuery<AnonymousMessage[]>({
    queryKey: ["/api/anonymous-messages", user?.id || admin?.id],
    enabled: !!(user || admin) && showInbox,
  });

  // Send anonymous message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/anonymous-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          recipientUserId: recipientProfile?.id,
          recipientAdminId: null, // For now, only supporting user recipients
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
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
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !recipientProfile) return;
    sendMessageMutation.mutate(message.trim());
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
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
              {recipientProfile.displayName?.[0] || recipientProfile.username[0]}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {recipientProfile.displayName || recipientProfile.username}
          </CardTitle>
          <CardDescription>
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
                    <p className="mb-3">{msg.content}</p>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                      <div className="flex gap-2">
                        <MessageViewer 
                          message={{
                            id: msg.id,
                            content: msg.content,
                            createdAt: msg.createdAt,
                            senderName: "Anonymous",
                            category: "confession",
                            recipient: recipientProfile.username,
                            reactionCount: 0,
                            replies: []
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
            <CardDescription>
              {recipientProfile.isAnonymousLinkPaused 
                ? "This user has temporarily paused anonymous messages"
                : "Your message will be sent completely anonymously"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recipientProfile.isAnonymousLinkPaused ? (
              <div className="p-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Anonymous Messages Paused</h3>
                <p className="text-gray-600">
                  @{recipientProfile.username} has temporarily paused their anonymous messaging. 
                  Please check back later or try reaching out through other means.
                </p>
              </div>
            ) : (
              <>
                <Textarea
                  placeholder="Type your anonymous message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {message.length}/500 characters
                  </span>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendMessageMutation.isPending ? "Sending..." : "Send Anonymously"}
                  </Button>
                </div>
              </>
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