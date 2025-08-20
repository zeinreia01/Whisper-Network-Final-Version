import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserBadge } from "@/components/user-badge";
import { NestedReplyThread } from "@/components/nested-reply-thread";
import { MessageViewer } from "@/components/message-viewer";
import { MessageSpotifyIntegration } from "@/components/message-spotify-integration";
import { AuthModal } from "@/components/auth-modal";
import { Link } from "wouter";
import { ExternalLink, MoreVertical, Trash2, AlertTriangle, Shield, Heart, User, Eye, EyeOff, Bookmark, MessageSquare, Flag } from "lucide-react";
import { categories } from "@/lib/categories";
import { formatTimeAgo } from "@/lib/utils";
import { getSpotifyDisplayName } from "@/lib/spotify";
import type { MessageWithReplies } from "@shared/schema";

interface MessageCardProps {
  message: MessageWithReplies;
  showReplies?: boolean;
  showThreaded?: boolean;
}

export function MessageCard({ message, showReplies = true, showThreaded = false }: MessageCardProps) {
  const [replyText, setReplyText] = useState("");
  const [nickname, setNickname] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [warningReason, setWarningReason] = useState("");
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [selectedReplyId, setSelectedReplyId] = useState<number | null>(null);
  const [hasReacted, setHasReacted] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { admin, user } = useAuth();

  // Auto-fill nickname for logged-in users
  const defaultNickname = user ? user.username : admin ? admin.displayName : "";

  // Initialize nickname when component mounts and reset on auth changes
  useEffect(() => {
    if (defaultNickname) {
      setNickname(defaultNickname);
    } else {
      setNickname("");
    }
  }, [defaultNickname, showReplyForm]);

  // Check if current user has reacted to this message
  useEffect(() => {
    if ((user || admin) && message.reactions) {
      const userReaction = message.reactions.find(reaction => 
        (user && reaction.userId === user.id) || 
        (admin && reaction.adminId === admin.id)
      );
      setHasReacted(!!userReaction);
    }
  }, [message.reactions, user, admin]);

  // Check if user has liked this message (for archive feature)
  useEffect(() => {
    // We'll check this with the personal archive when implemented
    setHasLiked(false);
  }, [user, admin, message.id]);

  const category = categories.find(c => c.id === message.category);

  const createReplyMutation = useMutation({
    mutationFn: async (data: { messageId: number; content: string; nickname: string; parentId?: number }) => {
      const replyData = {
        ...data,
        userId: user?.id,
        adminId: admin?.id,
        // Use authenticated nickname when user is logged in and hasn't changed it
        nickname: (user || admin) && data.nickname === defaultNickname 
          ? (user ? (user.displayName || user.username) : admin?.displayName) || data.nickname
          : data.nickname,
      };
      const response = await apiRequest("POST", "/api/replies", replyData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", message.id] });
      setReplyText("");
      setNickname(defaultNickname); // Reset to default nickname instead of empty
      setShowReplyForm(false);
      toast({
        title: "Reply sent!",
        description: "Your reply has been added to the conversation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ add }: { add: boolean }) => {
      const data = {
        userId: user?.id,
        adminId: admin?.id,
        type: "heart"
      };

      if (add) {
        const response = await apiRequest("POST", `/api/messages/${message.id}/reactions`, data);
        return await response.json();
      } else {
        const response = await apiRequest("DELETE", `/api/messages/${message.id}/reactions`, data);
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      setHasReacted(!hasReacted);
      toast({
        title: hasReacted ? "Reaction removed" : "Reaction added",
        description: hasReacted ? "You removed your heart reaction" : "You reacted with a heart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ add }: { add: boolean }) => {
      const data = {
        userId: user?.id,
        adminId: admin?.id,
      };

      if (add) {
        const response = await apiRequest("POST", `/api/messages/${message.id}/like`, data);
        return await response.json();
      } else {
        const response = await apiRequest("DELETE", `/api/messages/${message.id}/like`, data);
        return response;
      }
    },
    onSuccess: () => {
      setHasLiked(!hasLiked);
      toast({
        title: hasLiked ? "Removed from archive" : "Added to archive",
        description: hasLiked ? "Message removed from your personal archive" : "Message saved to your personal archive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update archive. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleHeartClick = () => {
    if (!user && !admin) {
      setShowAuthPrompt(true);
      return;
    }
    reactionMutation.mutate({ add: !hasReacted });
  };

  const handleArchiveClick = () => {
    if (!user && !admin) {
      setShowAuthPrompt(true);
      return;
    }
    likeMutation.mutate({ add: !hasLiked });
  };

  const privacyToggleMutation = useMutation({
    mutationFn: async (isPrivate: boolean) => {
      const response = await apiRequest("PATCH", `/api/messages/${message.id}/privacy`, {
        userId: user?.id,
        isOwnerPrivate: isPrivate
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/private"] });
      toast({
        title: "Privacy updated",
        description: message.isOwnerPrivate ? "Message is now public" : "Message is now private",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update message privacy.",
        variant: "destructive",
      });
    },
  });

  const handlePrivacyToggle = () => {
    privacyToggleMutation.mutate(!message.isOwnerPrivate);
  };

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const body: any = {};

      // Include authentication data
      if (user) {
        body.userId = user.id.toString();
        // Check if user is the recipient (board owner) of anonymous message
        if (message.recipient === user.username) {
          body.boardOwnerId = user.id.toString();
        }
      }
      if (admin) {
        body.adminUsername = admin.username;
      }

      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete message");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/private"] });
      toast({
        title: "Message deleted",
        description: "The message has been permanently removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete message.",
        variant: "destructive",
      });
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const response = await apiRequest("DELETE", `/api/replies/${replyId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      toast({
        title: "Reply deleted",
        description: "The reply has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete reply.",
        variant: "destructive",
      });
    },
  });

  const sendWarningMutation = useMutation({
    mutationFn: async (data: { replyId?: number; messageId?: number; reason: string; userId?: number }) => {
      const response = await apiRequest("POST", "/api/warnings", data);
      return await response.json();
    },
    onSuccess: () => {
      setWarningReason("");
      setShowWarningDialog(false);
      setSelectedReplyId(null);
      toast({
        title: "Warning sent",
        description: "The user has been notified about the content policy.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send warning.",
        variant: "destructive",
      });
    },
  });

  const reportMessageMutation = useMutation({
    mutationFn: async (data: { messageId: number; reason: string; reporterId: number; reporterType: string }) => {
      const response = await apiRequest("POST", "/api/reports/message", data);
      return await response.json();
    },
    onSuccess: () => {
      setReportReason("");
      setShowReportDialog(false);
      toast({
        title: "Report submitted",
        description: "Your report has been sent to the administrators for review.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit report.",
        variant: "destructive",
      });
    },
  });

  const handleReply = () => {
    if (!replyText.trim() || !nickname.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both your nickname and reply.",
        variant: "destructive",
      });
      return;
    }

    createReplyMutation.mutate({
      messageId: message.id,
      content: replyText,
      nickname: nickname,
      parentId: selectedReplyId || undefined, // Support nested replies
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const { replies } = message;

  const handleWarning = (replyId: any) => {
    setSelectedReplyId(replyId);
    setShowWarningDialog(true);
  };

  const handleReport = () => {
    if (!reportReason.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for reporting.",
        variant: "destructive",
      });
      return;
    }

    if (!user && !admin) {
      setShowAuthPrompt(true);
      return;
    }

    reportMessageMutation.mutate({
      messageId: message.id,
      reason: reportReason,
      reporterId: user?.id || admin?.id || 0,
      reporterType: user ? "user" : "admin",
    });
  };

  if (!message) {
    return null;
  }

  // Function to recursively count all replies, including nested ones
  const countAllReplies = (replies: any[]): number => {
    let count = replies.length;
    replies.forEach(reply => {
      if (reply.replies && Array.isArray(reply.replies)) {
        count += countAllReplies(reply.replies);
      }
    });
    return count;
  };

  const totalReplies = replies ? countAllReplies(replies) : 0;

  return (
    <div className="message-card bg-card pink:romantic-card rounded-xl shadow-lg pink:pink-glow p-4 sm:p-6 mb-4 sm:mb-6 hover:shadow-xl pink:hover:pink-glow transition-all duration-300">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <span className={`category-dot ${category?.color}`}></span>
          <span className={`text-sm font-medium ${category?.color}`}>
            {category?.name}
          </span>
        </div>
        {/* Show user type badge and verified status */}
        {(message.userId || message.adminId) && (
          <div className="flex items-center space-x-1">
            <UserBadge userType={message.adminId ? "admin" : "user"} variant="small" />
            {((message.user?.isVerified) || (message.admin?.isVerified)) && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
            )}
          </div>
        )}
        {message.recipient && (
          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded whitespace-nowrap">
            To: {message.recipient}
          </span>
        )}
        <span className="text-xs text-gray-500 whitespace-nowrap">
          • {formatTimeAgo(message.createdAt!)}
        </span>
      </div>

      {message.senderName && (
        <div className="mb-3">
          <div className="flex items-center space-x-3">
            {/* Show user avatar for authenticated senders */}
            {message.userId && message.user && (
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={message.user.profilePicture || undefined} 
                  alt={message.user.displayName || message.user.username}
                />
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {(message.user.displayName || message.user.username)?.charAt(0)?.toUpperCase() || ''}
                </AvatarFallback>
              </Avatar>
            )}
            {/* Show admin avatar for authenticated admins */}
            {message.adminId && message.admin && (
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={message.admin.profilePicture || undefined} 
                  alt={message.admin.displayName}
                />
                <AvatarFallback className="bg-purple-600 text-white text-sm">
                  {message.admin.displayName?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
            )}
            {/* Show generic avatar for anonymous posts */}
            {!message.userId && !message.adminId && (
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-600 text-white text-sm">
                  {message.senderName?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex items-center space-x-2">
              {/* Show authenticated user information with clickable username */}
              {message.userId && message.user && (user || admin) ? (
                <Link href={`/user/${message.userId}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary cursor-pointer transition-colors flex items-center space-x-1">
                    <span>From: {message.user?.displayName || message.user?.username}</span>
                    {message.user?.isVerified && (
                      <span className="text-blue-500 text-xs">✓</span>
                    )}
                  </span>
                </Link>
              ) : message.adminId && message.admin && (user || admin) ? (
                <Link href={`/admin/${message.adminId}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary cursor-pointer transition-colors flex items-center space-x-1">
                    <span>From: {message.admin?.displayName}</span>
                    {message.admin?.isVerified && (
                      <span className="text-blue-500 text-xs">✓</span>
                    )}
                  </span>
                </Link>
              ) : message.senderName ? (
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  From: {message.senderName}
                </span>
              ) : null}
              {/* View profile button for authenticated sender */}
              {message.userId && (user || admin) && (
                <Link href={`/user/${message.userId}`}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/10" title="View Profile">
                    <User className="h-4 w-4 text-primary" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-foreground mb-4 leading-relaxed message-text">{message.content}</p>

      {/* Enhanced Spotify Integration */}
      {(message.spotifyLink || message.spotifyTrackId) && (
            <MessageSpotifyIntegration
              spotifyTrackId={message.spotifyTrackId}
              spotifyTrackName={message.spotifyTrackName}
              spotifyArtistName={message.spotifyArtistName}
              spotifyAlbumCover={message.spotifyAlbumCover}
              spotifyLink={message.spotifyLink}
              size="sm"
              className="mt-3"
            />
          )}

      {/* Mobile-optimized action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mb-4 gap-2 sm:gap-3">
        {/* Primary actions row */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="hover:text-primary transition-colors flex-shrink-0 px-2 py-1"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            Reply
          </button>
          <span className="flex-shrink-0 px-1">{totalReplies} replies</span>

          {/* Heart reaction button - visible to everyone but prompts login for non-authenticated */}
          <button
            onClick={handleHeartClick}
            disabled={reactionMutation.isPending}
            className={`flex items-center space-x-1 transition-colors flex-shrink-0 px-2 py-1 ${
              hasReacted 
                ? 'text-red-500 hover:text-red-600' 
                : 'hover:text-red-500'
            }`}
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Heart 
              className={`w-4 h-4 ${hasReacted ? 'fill-current' : ''}`} 
            />
            <span>{message.reactionCount || 0}</span>
          </button>

          {/* Archive button for authenticated users */}
          {(user || admin) && (
            <button
              onClick={handleArchiveClick}
              disabled={likeMutation.isPending}
              className={`flex items-center space-x-1 transition-colors flex-shrink-0 px-2 py-1 ${
                hasLiked 
                  ? 'text-blue-500 hover:text-blue-600' 
                  : 'hover:text-blue-500'
              }`}
              title="Save to personal archive"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Bookmark 
                className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} 
              />
            </button>
          )}
        </div>

        {/* Secondary actions row */}
        <div className="flex items-center flex-wrap gap-1 sm:gap-2">
          <div className="flex items-center gap-1">
            <MessageViewer 
              message={message}
              trigger={
                <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-primary h-9 px-2">
                  <Eye className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">View Whisper</span>
                  <span className="sm:hidden">View</span>
                </Button>
              }
            />
            <Link href={`/message/${message.id}`}>
              <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-primary h-9 px-2">
                <ExternalLink className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">View Thread</span>
                <span className="sm:hidden">Thread</span>
              </Button>
            </Link>
          </div>

          {/* Admin Controls or User Board Control */}
          {(admin || (user && message.recipient === user.username) || (user || admin)) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Report option for all authenticated users */}
                {(user || admin) && (
                  <DropdownMenuItem
                    onClick={() => setShowReportDialog(true)}
                    className="text-orange-600"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report Message
                  </DropdownMenuItem>
                )}

                {/* Admin-only options */}
                {admin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedReplyId(null);
                        setShowWarningDialog(true);
                      }}
                      className="text-amber-600"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Send Warning
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => e.preventDefault()}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Message
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Message</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the message and all its replies. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMessageMutation.mutate(message.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}

                {/* Board owner deletion option - for public messages and dashboard posts */}
                {user && (message.recipient === user.username || message.targetUserId === user.id) && !admin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete from Board
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message from Your Board</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this message from your board. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMessageMutation.mutate(message.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete from Board
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User owns message - allow message privacy management */}
          {((user && message.userId === user.id) || (admin && message.adminId === admin.id)) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" title="Manage your message">
                  <Shield className="h-4 w-4 text-blue-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <Shield className="h-4 w-4 mr-2" />
                  Your Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrivacyToggle()}>
                  {message.isOwnerPrivate ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {message.isOwnerPrivate ? "Make Public" : "Make Private"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Threaded Replies Section - Only show if explicitly requested (message thread page) - SHOW ALL REPLIES */}
      {showThreaded && message.replies && Array.isArray(message.replies) && message.replies.length > 0 && (
        <NestedReplyThread
          replies={message.replies}
          messageId={message.id}
          messageUserId={message.userId ?? undefined}
          showAll={true}
          showReplyForm={true}
          onWarning={(replyId) => {
            setSelectedReplyId(replyId);
            setShowWarningDialog(true);
          }}
        />
      )}

      {/* Replies Preview - Only show on dashboard, not in thread view - SHOW ONLY 2 REPLIES SIMPLE */}
      {showReplies && !showThreaded && message.replies && Array.isArray(message.replies) && message.replies.length > 0 && (
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</span>
            </div>
            <Link href={`/message/${message.id}`}>
              <Button variant="outline" size="sm">
                View all {totalReplies} replies
              </Button>
            </Link>
          </div>

          {/* Show only first 2 replies - SIMPLE, NO NESTING */}
          <div className="space-y-3">
            {message.replies.slice(0, 2).map((reply) => (
              <div key={reply.id} className="flex items-start space-x-3 py-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage 
                    src={reply.user?.profilePicture || reply.admin?.profilePicture || ''} 
                    alt={reply.nickname} 
                  />
                  <AvatarFallback className="text-xs">
                    {reply.nickname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link 
                      href={reply.userId ? `/user/${reply.userId}` : reply.adminId ? `/admin/${reply.adminId}` : '#'}
                      className="font-medium text-sm hover:underline text-foreground"
                    >
                      {reply.nickname}
                    </Link>
                    {(reply.userId || reply.adminId) && (
                      <UserBadge 
                        userType={reply.adminId ? "admin" : "user"} 
                        variant="small" 
                      />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(reply.createdAt || new Date())}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {reply.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply prompt for non-authenticated users on dashboard */}
      {showReplies && !showThreaded && !(user || admin) && message.replies && Array.isArray(message.replies) && message.replies.length > 0 && (
        <div className="border-t pt-4">
          <div className="text-center text-sm text-muted-foreground">
            <Link href={`/message/${message.id}`}>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Join the discussion
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Replies section for authenticated users on dashboard */}
      {showReplies && !showThreaded && (user || admin) && (
        <div className="border-t pt-4">
          <div className="text-center">
            <Link href={`/message/${message.id}`}>
              <Button variant="outline" size="sm" className="text-primary hover:text-primary/80">
                <MessageSquare className="w-4 h-4 mr-2" />
                Reply to this message
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Warning Dialog */}
      {showWarningDialog && (
        <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send Warning</AlertDialogTitle>
              <AlertDialogDescription>
                Send a warning to the user about their content. Please provide a reason for the warning.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="Enter the reason for this warning..."
                value={warningReason}
                onChange={(e) => setWarningReason(e.target.value)}
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => sendWarningMutation.mutate({
                  replyId: selectedReplyId || undefined,
                  messageId: !selectedReplyId ? message.id : undefined,
                  reason: warningReason,
                  userId: message.userId || undefined,
                })}
                disabled={!warningReason.trim() || sendWarningMutation.isPending}
                className="bg-amber-600 hover:bg-amber-amber-700"
              >
                {sendWarningMutation.isPending ? "Sending..." : "Send Warning"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Authentication prompt dialog */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to log in to react to messages and save them to your personal archive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowAuthPrompt(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowAuthPrompt(false);
              setShowAuthModal(true);
                          }}>
              Login / Sign Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Message Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Message</DialogTitle>
            <DialogDescription>
              Help us maintain a safe community by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Please describe why you're reporting this message..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReport}
              disabled={!reportReason.trim() || reportMessageMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {reportMessageMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}