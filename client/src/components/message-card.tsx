import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserBadge } from "@/components/user-badge";
import { Link } from "wouter";
import { ExternalLink, MoreVertical, Trash2, AlertTriangle, Shield, Heart, User } from "lucide-react";
import { categories } from "@/lib/categories";
import { formatTimeAgo } from "@/lib/utils";
import type { MessageWithReplies } from "@shared/schema";

interface MessageCardProps {
  message: MessageWithReplies;
  showReplies?: boolean;
  showAdminControls?: boolean;
}

export function MessageCard({ message, showReplies = true, showAdminControls = false }: MessageCardProps) {
  const [replyText, setReplyText] = useState("");
  const [nickname, setNickname] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [warningReason, setWarningReason] = useState("");
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [selectedReplyId, setSelectedReplyId] = useState<number | null>(null);
  const [hasReacted, setHasReacted] = useState(false);
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

  const category = categories.find(c => c.id === message.category);
  
  const createReplyMutation = useMutation({
    mutationFn: async (data: { messageId: number; content: string; nickname: string }) => {
      const replyData = {
        ...data,
        userId: user?.id,
        adminId: admin?.id,
      };
      const response = await apiRequest("POST", "/api/replies", replyData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
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

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("DELETE", `/api/messages/${messageId}`);
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

  return (
    <div className="message-card bg-card rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 hover:shadow-xl transition-all duration-300">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <span className={`category-dot ${category?.color}`}></span>
          <span className={`text-sm font-medium ${category?.color}`}>
            {category?.name}
          </span>
        </div>
        {/* Show user type badge */}
        {message.userId && <UserBadge userType="user" variant="small" />}
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
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium">From: {message.senderName}</span>
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
      )}

      <p className="text-foreground mb-4 leading-relaxed">{message.content}</p>

      {message.spotifyLink && (
        <div className="bg-muted rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56z"/>
            </svg>
            <span className="text-sm text-gray-600">🎵 Music attached</span>
            <a 
              href={message.spotifyLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-700"
            >
              Listen on Spotify
            </a>
          </div>
        </div>
      )}

      {/* Mobile-optimized action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mb-4 gap-3">
        {/* Primary actions row */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="hover:text-primary transition-colors flex-shrink-0"
          >
            Reply
          </button>
          <span className="flex-shrink-0">{message.replies.length} replies</span>
          
          {/* Heart reaction button - only for authenticated users */}
          {(user || admin) && (
            <button
              onClick={() => reactionMutation.mutate({ add: !hasReacted })}
              disabled={reactionMutation.isPending}
              className={`flex items-center space-x-1 transition-colors flex-shrink-0 ${
                hasReacted 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'hover:text-red-500'
              }`}
            >
              <Heart 
                className={`w-4 h-4 ${hasReacted ? 'fill-current' : ''}`} 
              />
              <span>{message.reactionCount || 0}</span>
            </button>
          )}
          
          {/* Show reaction count for non-authenticated users */}
          {!user && !admin && message.reactionCount && message.reactionCount > 0 && (
            <div className="flex items-center space-x-1 text-gray-400 flex-shrink-0">
              <Heart className="w-4 h-4" />
              <span>{message.reactionCount}</span>
            </div>
          )}
        </div>
        
        {/* Secondary actions row */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link href={`/message/${message.id}`}>
            <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-primary h-8">
              <ExternalLink className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">View Thread</span>
              <span className="sm:hidden">View</span>
            </Button>
          </Link>
          
          {/* Admin Controls */}
          {admin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* User owns message - allow reply management */}
          {user && message.userId === user.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Manage your message">
                  <Shield className="h-4 w-4 text-blue-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <Shield className="h-4 w-4 mr-2" />
                  Your Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {showReplyForm && (
        <div className="border-t pt-4 mb-4">
          <div className="space-y-3">
            <Input
              placeholder={defaultNickname ? `Replying as: ${defaultNickname}` : "Your nickname..."}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={!!defaultNickname}
              className={defaultNickname ? "bg-muted text-muted-foreground" : ""}
            />
            <Input
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button 
                onClick={handleReply}
                disabled={createReplyMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createReplyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReplies && message.replies.length > 0 && (
        <div className="border-t pt-4">
          <div className="space-y-3">
            {message.replies.map((reply) => (
              <div key={reply.id} className="flex items-start space-x-2 sm:space-x-3 group">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {reply.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {/* Make nickname clickable for authenticated users */}
                        {reply.userId && (user || admin) ? (
                          <Link href={`/user/${reply.userId}`}>
                            <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                              {reply.nickname}
                            </button>
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{reply.nickname}</span>
                        )}
                      </div>
                      {/* Show user type badges */}
                      {reply.adminId && <UserBadge userType="admin" variant="small" />}
                      {reply.userId && !reply.adminId && <UserBadge userType="user" variant="small" />}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(reply.createdAt!)}
                      </span>
                    </div>
                    
                    {/* Reply management controls */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 flex-shrink-0">
                      {/* Admin controls */}
                      {admin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReplyId(reply.id);
                                setShowWarningDialog(true);
                              }}
                              className="text-amber-600"
                            >
                              <AlertTriangle className="h-3 w-3 mr-2" />
                              Send Warning
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete Reply
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this reply. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteReplyMutation.mutate(reply.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {/* User owns message - can delete replies on their message */}
                      {user && message.userId === user.id && !admin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Delete reply on your message">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this reply from your message. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteReplyMutation.mutate(reply.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Reply
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{reply.content}</p>
                </div>
              </div>
            ))}
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
                className="bg-amber-600 hover:bg-amber-700"
              >
                {sendWarningMutation.isPending ? "Sending..." : "Send Warning"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
