import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Reply,
  User
} from "lucide-react";
import type { ReplyWithUser } from "@shared/schema";

interface NestedReplyThreadProps {
  replies: ReplyWithUser[];
  messageId: number;
  messageUserId?: number;
  onWarning?: (replyId: number) => void;
  showAll?: boolean;
  showReplyForm?: boolean;
}

interface ThreadedReply extends ReplyWithUser {
  children: ThreadedReply[];
  level: number;
}

interface ReplyItemProps {
  reply: ThreadedReply;
  messageId: number;
  messageUserId?: number;
  onWarning?: (replyId: number) => void;
  onReply: (parentId: number, parentNickname: string) => void;
  maxLevel: number;
}

const MAX_NESTING_LEVEL = 5;
const MAX_REPLIES_PER_MESSAGE = 500;

// Individual Reply Component with proper nesting
function ReplyItem({ reply, messageId, messageUserId, onWarning, onReply, maxLevel }: ReplyItemProps) {
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showChildren, setShowChildren] = useState(true);

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

  const isOwn = (user && reply.userId === user.id) || (admin && reply.adminId === admin.id);
  const isAdminOrModerator = admin;
  const canDelete = isOwn || isAdminOrModerator;
  const canReply = (user || admin) && reply.level < maxLevel;

  return (
    <div className="relative">
      {/* Threading lines for visual hierarchy */}
      {reply.level > 0 && (
        <>
          {/* Vertical line connecting to parent */}
          <div 
            className="absolute top-0 w-0.5 bg-border/60"
            style={{ 
              left: `${reply.level * 16}px`,
              height: '24px'
            }}
          />
          {/* Horizontal line to reply */}
          <div 
            className="absolute top-6 h-0.5 bg-border/60"
            style={{ 
              left: `${reply.level * 16}px`,
              width: '16px'
            }}
          />
        </>
      )}

      {/* Main reply content */}
      <div 
        className={`flex items-start space-x-3 py-3 group relative border-l-2 border-transparent hover:border-border/20 transition-colors`}
        style={{ marginLeft: reply.level > 0 ? `${reply.level * 24}px` : '0' }}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage 
            src={reply.user?.profilePicture || reply.admin?.profilePicture || ''} 
            alt={reply.nickname} 
          />
          <AvatarFallback className="text-xs">
            {reply.nickname.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Reply content */}
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
            
            {reply.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChildren(!showChildren)}
                className="text-xs h-6 px-2"
              >
                {showChildren ? 'Hide' : 'Show'} {reply.children.length} {reply.children.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>

          <p className="text-sm text-foreground mb-2 whitespace-pre-wrap break-words">
            {reply.content}
          </p>

          {/* Reply actions */}
          <div className="flex items-center space-x-2">
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(reply.id, reply.nickname)}
                className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {/* Admin actions */}
            {(canDelete || onWarning) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onWarning && (
                    <DropdownMenuItem onClick={() => onWarning(reply.id)}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Send Warning
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Reply
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this reply? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteReplyMutation.mutate(reply.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Child replies */}
      {reply.children && reply.children.length > 0 && showChildren && (
        <div className="relative">
          {reply.children.map((childReply) => (
            <ReplyItem
              key={childReply.id}
              reply={childReply}
              messageId={messageId}
              messageUserId={messageUserId}
              onWarning={onWarning}
              onReply={onReply}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NestedReplyThread({ 
  replies, 
  messageId, 
  messageUserId, 
  onWarning, 
  showAll = false,
  showReplyForm = true 
}: NestedReplyThreadProps) {
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyingToNickname, setReplyingToNickname] = useState<string>("");

  // Build threaded reply structure
  const threadedReplies = useMemo(() => {
    if (!replies || replies.length === 0) return [];

    console.log('Building threaded replies from:', replies);

    const replyMap = new Map<number, ThreadedReply>();
    const rootReplies: ThreadedReply[] = [];

    // First pass: create map of all replies with children array and initial level 0
    replies.forEach(reply => {
      replyMap.set(reply.id, {
        ...reply,
        children: [],
        level: 0
      });
    });

    console.log('Reply map created with', replyMap.size, 'replies');

    // Second pass: organize into parent-child relationships
    replies.forEach(reply => {
      const threadedReply = replyMap.get(reply.id)!;
      
      if (reply.parentId && replyMap.has(reply.parentId)) {
        // This is a child reply - add it to parent's children
        const parent = replyMap.get(reply.parentId);
        if (parent) {
          parent.children.push(threadedReply);
          console.log(`Added reply ${reply.id} as child of ${reply.parentId}`);
        }
      } else {
        // This is a root reply (no parent or parent not found) - add to root array
        rootReplies.push(threadedReply);
        console.log(`Added reply ${reply.id} as root reply (parentId: ${reply.parentId})`);
      }
    });

    console.log('Root replies:', rootReplies.length);
    console.log('Root replies with children:', rootReplies.map(r => ({ id: r.id, children: r.children.length })));

    // Third pass: calculate levels recursively
    const calculateLevels = (replies: ThreadedReply[], level: number = 0) => {
      replies.forEach(reply => {
        reply.level = Math.min(level, MAX_NESTING_LEVEL);
        if (reply.children.length > 0) {
          calculateLevels(reply.children, level + 1);
        }
      });
    };

    // Sort by creation date at each level
    const sortReplies = (replies: ThreadedReply[]) => {
      replies.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      replies.forEach(reply => {
        if (reply.children.length > 0) {
          sortReplies(reply.children);
        }
      });
    };

    calculateLevels(rootReplies);
    sortReplies(rootReplies);
    
    console.log('Final threaded structure:', rootReplies);
    return rootReplies;
  }, [replies]);

  const createReplyMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: number }) => {
      if (!user && !admin) {
        throw new Error("Must be authenticated to reply");
      }

      const nickname = admin ? admin.displayName : user!.username;
      const replyData = {
        content: data.content,
        nickname,
        messageId,
        parentId: data.parentId || null,
        userId: user?.id || null,
        adminId: admin?.id || null,
      };

      const response = await apiRequest("POST", "/api/replies", replyData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${messageId}`] });
      setReplyContent("");
      setReplyingToId(null);
      setReplyingToNickname("");
      toast({
        title: "Reply posted",
        description: "Your reply has been added to the discussion.",
      });
    },
    onError: (error) => {
      console.error("Reply error:", error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReply = (parentId: number, parentNickname: string) => {
    setReplyingToId(parentId);
    setReplyingToNickname(parentNickname);
    setReplyContent(`@${parentNickname} `);
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || createReplyMutation.isPending) return;

    createReplyMutation.mutate({
      content: replyContent.trim(),
      parentId: replyingToId || undefined,
    });
  };

  const displayReplies = showAll ? threadedReplies : threadedReplies.slice(0, 2);

  console.log('NestedReplyThread render:', {
    totalReplies: replies?.length || 0,
    threadedReplies: threadedReplies.length,
    displayReplies: displayReplies.length,
    showAll,
    showReplyForm
  });

  if (!replies || replies.length === 0) {
    return showReplyForm ? (
      <div className="border-t pt-4">
        {(user || admin) ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Start the discussion</h4>
            <div className="space-y-3">
              <Textarea
                placeholder="Share your thoughts..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Be respectful and constructive
                </span>
                <Button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || createReplyMutation.isPending}
                  size="sm"
                >
                  {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 pink:bg-rose-50 border border-amber-200 dark:border-amber-700 pink:border-rose-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 pink:text-rose-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Authentication Required</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400 pink:text-rose-700 mt-2">
              Please <Link href="/login" className="underline hover:no-underline">log in</Link> to start the discussion.
            </p>
          </div>
        )}
      </div>
    ) : null;
  }

  return (
    <div className="border-t pt-4 space-y-4">
      {/* Reply count and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
          {replies.length >= MAX_REPLIES_PER_MESSAGE && (
            <Badge variant="secondary" className="text-xs">
              Reply limit reached
            </Badge>
          )}
        </div>
        
        {!showAll && replies.length > 2 && (
          <Link href={`/message/${messageId}`}>
            <Button variant="outline" size="sm">
              View all {replies.length} replies
            </Button>
          </Link>
        )}
      </div>

      {/* Threaded replies */}
      <div className="space-y-1">
        {displayReplies.map((reply) => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            messageId={messageId}
            messageUserId={messageUserId}
            onWarning={onWarning}
            onReply={handleReply}
            maxLevel={MAX_NESTING_LEVEL}
          />
        ))}
      </div>

      {/* Reply form section */}
      {showReplyForm && showAll && (
        <div className="space-y-3 pt-4 border-t">
          {(user || admin) ? (
            <>
              {replyingToId && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Reply className="h-4 w-4" />
                  <span>Replying to {replyingToNickname}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyingToNickname("");
                      setReplyContent("");
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              
              <div className="space-y-3">
                <Textarea
                  placeholder={replyingToId ? `Reply to ${replyingToNickname}...` : "Add to the discussion..."}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Be respectful and constructive
                  </span>
                  <Button
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || createReplyMutation.isPending}
                    size="sm"
                  >
                    {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 pink:bg-rose-50 border border-amber-200 dark:border-amber-700 pink:border-rose-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 pink:text-rose-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Authentication Required</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400 pink:text-rose-700 mt-2">
                Please <Link href="/login" className="underline hover:no-underline">log in</Link> to join the conversation.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}