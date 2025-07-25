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
}

interface ReplyItemProps {
  reply: ReplyWithUser;
  messageId: number;
  messageUserId?: number;
  level: number;
  onWarning: (replyId: number) => void;
  onReply: (parentId: number, parentNickname: string) => void;
}

const MAX_NESTING_LEVEL = 3; // Limit nesting to avoid infinite depth

function ReplyItem({ reply, messageId, messageUserId, level, onWarning, onReply }: ReplyItemProps) {
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

  // Build nested replies recursively
  const childReplies = reply.children || [];

  return (
    <div className="relative">
      {/* Threading line - Only show if not at root level */}
      {level > 0 && (
        <div 
          className="absolute left-4 top-0 bottom-6 w-0.5 bg-border" 
          style={{ left: `${(level - 1) * 24 + 16}px` }}
        />
      )}

      {/* Reply content */}
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
                {/* Make nickname clickable for authenticated users */}
                {reply.userId && (user || admin) ? (
                  <Link href={`/user/${reply.userId}`}>
                    <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      {reply.nickname}
                    </button>
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-foreground">{reply.nickname}</span>
                )}
                {/* User type badges */}
                {reply.adminId && <UserBadge userType="admin" variant="small" />}
                {reply.userId && !reply.adminId && <UserBadge userType="user" variant="small" />}
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(reply.createdAt!)}
                </span>
              </div>

              {/* Reply management controls */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
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

                {/* Message owner can delete replies */}
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
            <p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
          </div>

          {/* Reply action */}
          {level < MAX_NESTING_LEVEL && (user || admin) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(reply.id, reply.nickname)}
              className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground mb-2"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>

      {/* Nested replies */}
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
  isPreview = false,
  maxDepth = 3 
}: ThreadedRepliesProps) {
  const [showAll, setShowAll] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [nickname, setNickname] = useState("");
  const [parentReplyId, setParentReplyId] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { admin, user } = useAuth();

  // Auto-fill nickname for logged-in users
  const defaultNickname = user ? user.username : admin ? admin.displayName : "";

  // Initialize nickname when component mounts
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
      queryClient.invalidateQueries({ queryKey: ["/api/messages", messageId] });
      setReplyText("");
      setNickname(defaultNickname);
      setParentReplyId(null);
      setShowReplyForm(false);
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

    createReplyMutation.mutate({
      messageId,
      content: replyText,
      nickname: nickname,
      parentId: parentReplyId || undefined,
    });
  };

  // Ensure replies is an array and handle nested structure properly
  const validReplies = Array.isArray(replies) ? replies.filter(reply => reply && reply.id) : [];

  if (validReplies.length === 0) {
    return null;
  }

  // For preview mode, only show first 2 replies
  const displayReplies = isPreview && !showAll ? validReplies.slice(0, 2) : validReplies;

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
      </div>

      {/* Threaded replies */}
      <div className="space-y-3">
        {(isPreview ? threadedReplies.slice(0, 2) : threadedReplies).map((reply) => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            messageId={messageId}
            messageUserId={messageUserId}
            level={0}
            onWarning={onWarning}
            onReply={onReply}
          />
        ))}

        {/* Show "more replies" indicator in preview mode */}
        {isPreview && replies.length > 2 && (
          <div className="text-xs text-muted-foreground ml-8 border-t pt-2">
            +{replies.length - 2} more replies - 
            <Link href={`/message/${messageId}`}>
              <Button variant="link" className="text-xs p-0 h-auto ml-1">
                View full thread
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Reply form */}
      {replyingTo && (
        <div className="reply-form-container bg-muted/20 border rounded-lg p-4 mt-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
            <Reply className="h-4 w-4" />
            <span>Replying to {replyingTo.nickname}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingTo(null);
                setReplyText("");
                setNickname(defaultNickname);
              }}
              className="h-6 px-2 text-xs ml-auto"
            >
              Cancel
            </Button>
          </div>

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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <div className="flex space-x-2">
              <Button 
                onClick={handleReply}
                disabled={createReplyMutation.isPending || !replyText.trim() || !nickname.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {createReplyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                  setNickname(defaultNickname);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}