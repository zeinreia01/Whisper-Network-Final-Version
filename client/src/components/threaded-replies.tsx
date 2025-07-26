import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserBadge } from "@/components/user-badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatTimeAgo } from "@/lib/utils";
import { Link } from "wouter";
import { 
  MessageSquare, 
  MoreVertical, 
  Trash2, 
  AlertTriangle,
  Reply
} from "lucide-react";
import type { ReplyWithUser } from "@shared/schema";

interface ThreadedRepliesProps {
  replies: ReplyWithUser[];
  messageId: number;
  messageUserId?: number;
  onWarning: (replyId: number) => void;
  onReply?: (parentId: number, parentNickname: string) => void;
  showAll?: boolean;
}

interface ReplyItemProps {
  reply: ReplyWithUser;
  messageId: number;
  messageUserId?: number;
  level: number;
  onWarning: (replyId: number) => void;
  onReply: (parentId: number, parentNickname: string) => void;
  showAll: boolean;
}

const MAX_NESTING_LEVEL = 5;
const MAX_REPLIES_PER_MESSAGE = 500;

// Recursive Reply Component
function ReplyItem({ reply, messageId, messageUserId, level, onWarning, onReply, showAll }: ReplyItemProps) {
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const response = await apiRequest("DELETE", `/api/replies/${replyId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${messageId}`] });
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

  // Get child replies from the children array
  const childReplies = reply.children || [];

  return (
    <div className="relative">
      {/* Threading line for nested replies */}
      {level > 0 && (
        <div 
          className="absolute left-4 top-0 bottom-6 w-0.5 bg-border" 
          style={{ left: `${(level - 1) * 24 + 16}px` }}
        />
      )}

      {/* Main reply content */}
      <div 
        className="flex items-start space-x-3 group relative"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 shadow-sm relative z-10">
          {reply.nickname.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-muted/30 rounded-lg px-3 py-2 mb-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                {reply.userId && (user || admin) ? (
                  <Link href={`/user/${reply.userId}`}>
                    <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      {reply.nickname}
                    </button>
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-foreground">{reply.nickname}</span>
                )}
                {reply.adminId && <UserBadge userType="admin" variant="small" />}
                {reply.userId && !reply.adminId && <UserBadge userType="user" variant="small" />}
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(reply.createdAt!)}
                </span>
              </div>

              {/* Reply management controls */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                {admin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onWarning(reply.id)}
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
                              This will permanently delete this reply and all its nested replies. This action cannot be undone.
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

                {user && messageUserId === user.id && !admin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this reply from your message.
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
                )}
              </div>
            </div>

            {/* Reply content */}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{reply.content}</p>
          </div>

          {/* Reply button - only show if within nesting limit and user is authenticated */}
          {level < MAX_NESTING_LEVEL && (user || admin) && showAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(reply.id, reply.nickname)}
              className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground hover:bg-muted mb-2"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>

      {/* Render child replies recursively - THIS IS THE KEY FIX */}
      {childReplies.length > 0 && (
        <div className="mt-2">
          {childReplies.map((childReply) => (
            <ReplyItem
              key={childReply.id}
              reply={childReply}
              messageId={messageId}
              messageUserId={messageUserId}
              level={level + 1}
              onWarning={onWarning}
              onReply={onReply}
              showAll={showAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreadedReplies({ 
  replies, 
  messageId, 
  messageUserId, 
  onWarning,
  showAll = false
}: ThreadedRepliesProps) {
  const [replyText, setReplyText] = useState("");
  const [nickname, setNickname] = useState("");
  const [parentReplyId, setParentReplyId] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; nickname: string } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { admin, user } = useAuth();

  const defaultNickname = user ? user.username : admin ? admin.displayName : "";

  useEffect(() => {
    if ((user || admin) && defaultNickname) {
      setNickname(defaultNickname);
    }
  }, [defaultNickname, user, admin]);

  const createReplyMutation = useMutation({
    mutationFn: async (data: { messageId: number; content: string; nickname: string; parentId?: number }) => {
      const replyData = {
        ...data,
        userId: user?.id,
        adminId: admin?.id,
        nickname: (user || admin) && data.nickname === defaultNickname 
          ? (user ? (user.displayName || user.username) : admin?.displayName) || data.nickname
          : data.nickname,
      };
      const response = await apiRequest("POST", "/api/replies", replyData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${messageId}`] });
      setReplyText("");
      setNickname(defaultNickname);
      setParentReplyId(null);
      setShowReplyForm(false);
      setReplyingTo(null);
      toast({
        title: "Reply sent!",
        description: "Your reply has been added to the conversation.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
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

    // Check if we're at the reply limit
    if (replies.length >= MAX_REPLIES_PER_MESSAGE) {
      toast({
        title: "Reply limit reached",
        description: `This thread has reached the maximum of ${MAX_REPLIES_PER_MESSAGE} replies.`,
        variant: "destructive",
      });
      return;
    }

    createReplyMutation.mutate({
      messageId,
      content: replyText,
      nickname: nickname,
      parentId: parentReplyId || undefined,
    });
  };

  const onReply = (parentId: number, parentNickname: string) => {
    setReplyingTo({ id: parentId, nickname: parentNickname });
    setParentReplyId(parentId);
    setShowReplyForm(true);
    setReplyText("");
    setNickname(defaultNickname);
  };

  // Organize replies into threaded structure
  const threadedReplies = React.useMemo(() => {
    if (!replies || replies.length === 0) return [];

    const replyMap = new Map<number, ReplyWithUser & { children: ReplyWithUser[] }>();
    const rootReplies: (ReplyWithUser & { children: ReplyWithUser[] })[] = [];

    // First pass: create all reply objects with empty children arrays
    replies.forEach(reply => {
      const threadedReply = {
        ...reply,
        children: []
      };
      replyMap.set(reply.id, threadedReply);
    });

    // Second pass: organize into parent-child relationships
    replies.forEach(reply => {
      const threadedReply = replyMap.get(reply.id)!;

      if (reply.parentId && replyMap.has(reply.parentId)) {
        // This is a child reply - add it to parent's children
        const parent = replyMap.get(reply.parentId);
        if (parent) {
          parent.children.push(threadedReply);
        }
      } else {
        // This is a root reply - add to root array
        rootReplies.push(threadedReply);
      }
    });

    return rootReplies;
  }, [replies]);

  if (!replies || replies.length === 0) {
    return null;
  }

  // For dashboard preview (showAll=false): show only first 2 root replies without nesting
  // For thread view (showAll=true): show all replies with full nesting
  const displayReplies = showAll ? threadedReplies : threadedReplies.slice(0, 2);

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        {replies.length >= MAX_REPLIES_PER_MESSAGE && (
          <Badge variant="secondary" className="text-xs">
            Reply limit reached
          </Badge>
        )}
      </div>

      {/* Render replies */}
      <div className="space-y-3">
        {displayReplies.map((reply) => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            messageId={messageId}
            messageUserId={messageUserId}
            level={0}
            onWarning={onWarning}
            onReply={onReply}
            showAll={showAll}
          />
        ))}

        {/* Show "View all replies" link when in preview mode and there are more replies */}
        {!showAll && threadedReplies.length > 2 && (
          <div className="text-center pt-2">
            <Link href={`/message/${messageId}`}>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                View all {replies.length} replies →
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Reply form - ALWAYS show for authenticated users when showAll is true */}
      {showAll && (user || admin) && (
        <div className="reply-form-container bg-muted/20 border rounded-lg p-4 mt-6">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-foreground mb-2">Add Your Reply</h4>
            <p className="text-sm text-muted-foreground">Join the conversation and share your thoughts</p>
          </div>

          {replyingTo && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3 p-2 bg-primary/10 rounded">
              <Reply className="h-4 w-4" />
              <span>Replying to <strong>{replyingTo.nickname}</strong></span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setParentReplyId(null);
                  setReplyText("");
                  setNickname(defaultNickname);
                }}
                className="h-6 px-2 text-xs ml-auto"
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {defaultNickname ? "Posting as:" : "Your nickname:"}
              </label>
              <Input
                placeholder={defaultNickname ? defaultNickname : "Enter your nickname..."}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={!!defaultNickname}
                className={defaultNickname ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Your reply:
              </label>
              <textarea
                placeholder="Write your reply here... (Press Enter to submit, Shift+Enter for new line)"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
                className="w-full min-h-[100px] p-3 border border-border rounded-md bg-background text-foreground resize-vertical"
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleReply}
                disabled={createReplyMutation.isPending || !replyText.trim() || !nickname.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
              >
                {createReplyMutation.isPending ? "Posting Reply..." : "Post Reply"}
              </Button>
              {replyingTo && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setReplyingTo(null);
                    setParentReplyId(null);
                    setReplyText("");
                    setNickname(defaultNickname);
                  }}
                  className="bg-background hover:bg-muted border-border"
                >
                  Cancel Reply
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show login prompt for non-authenticated users */}
      {showAll && !(user || admin) && (
        <div className="reply-form-container bg-muted/10 border rounded-lg p-6 mt-6 text-center">
          <h4 className="text-lg font-medium text-foreground mb-2">Join the Discussion</h4>
          <p className="text-muted-foreground mb-4">Log in to share your thoughts and reply to this message</p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/login">Log In to Reply</Link>
          </Button>
        </div>
      )}
    </div>
  );
}