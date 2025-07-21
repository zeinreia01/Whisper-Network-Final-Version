
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserBadge } from "@/components/user-badge";
import { Link } from "wouter";
import { MoreVertical, Trash2, AlertTriangle, User, Reply } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { ReplyWithUser } from "@shared/schema";

interface NestedReplyProps {
  reply: ReplyWithUser;
  messageId: number;
  depth?: number;
  maxDepth?: number;
  onReply: (reply: ReplyWithUser) => void;
}

export function NestedReply({ reply, messageId, depth = 0, maxDepth = 3, onReply }: NestedReplyProps) {
  const [selectedReplyId, setSelectedReplyId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { admin, user } = useAuth();

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

  const renderMentions = (content: string) => {
    return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>');
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start space-x-2 sm:space-x-3 group mb-3">
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {reply.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
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
              {reply.adminId && <UserBadge userType="admin" variant="small" />}
              {reply.userId && !reply.adminId && <UserBadge userType="user" variant="small" />}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(reply.createdAt!)}
              </span>
            </div>
            
            {/* Reply management controls */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 flex-shrink-0">
              {/* Reply button - only show if not at max depth */}
              {depth < maxDepth && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-gray-500 hover:text-primary"
                  onClick={() => onReply(reply)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}

              {/* Admin controls */}
              {admin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
            </div>
          </div>
          <div 
            className="text-sm text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: renderMentions(reply.content) }}
          />
        </div>
      </div>

      {/* Render nested replies */}
      {reply.childReplies && reply.childReplies.length > 0 && (
        <div className="mt-2">
          {reply.childReplies.map((childReply) => (
            <NestedReply
              key={childReply.id}
              reply={childReply}
              messageId={messageId}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
