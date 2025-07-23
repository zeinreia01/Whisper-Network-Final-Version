import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Reply as ReplyIcon, Trash2, AlertTriangle, Info, Calendar, Music, Shield } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { MESSAGE_CATEGORIES } from "@shared/schema";
import type { MessageWithReplies, Reply, ReplyWithUser } from "@shared/schema";

export default function MessageThread() {
  const { id } = useParams();
  const [replyForm, setReplyForm] = useState({ 
    content: "", 
    nickname: "",
    parentId: null as number | null,
    mentionedUserId: null as number | null,
    mentionedAdminId: null as number | null,
  });
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [deleteReplyId, setDeleteReplyId] = useState<number | null>(null);
  const { admin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-fill nickname for authenticated users
  useEffect(() => {
    const defaultNickname = user ? user.username : admin ? admin.displayName : "";
    if (defaultNickname) {
      setReplyForm(prev => ({ ...prev, nickname: defaultNickname }));
    }
  }, [user, admin]);

  const { data: message, isLoading } = useQuery<MessageWithReplies>({
    queryKey: ["/api/messages", id],
    enabled: !!id,
  });

  const addReplyMutation = useMutation({
    mutationFn: async (data: { content: string; nickname: string; parentId?: number | null; mentionedUserId?: number | null; mentionedAdminId?: number | null }) => {
      const replyData = {
        messageId: parseInt(id!),
        content: data.content,
        nickname: data.nickname,
        userId: user?.id,
        adminId: admin?.id,
        parentId: data.parentId,
        mentionedUserId: data.mentionedUserId,
        mentionedAdminId: data.mentionedAdminId,
      };
      return await apiRequest("POST", "/api/replies", replyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", id] });
      const defaultNickname = user ? user.username : admin ? admin.displayName : "";
      setReplyForm({ 
        content: "", 
        nickname: defaultNickname,
        parentId: null,
        mentionedUserId: null,
        mentionedAdminId: null,
      });
      toast({
        title: "Reply added",
        description: "Your reply has been posted successfully.",
      });
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      return await apiRequest("DELETE", `/api/replies/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", id] });
      setDeleteReplyId(null);
      toast({
        title: "Reply deleted",
        description: "The reply has been removed for violating community guidelines.",
      });
    },
  });

  const sendWarningMutation = useMutation({
    mutationFn: async (data: { replyId: number; reason: string }) => {
      return await apiRequest("POST", "/api/warnings", data);
    },
    onSuccess: () => {
      toast({
        title: "Warning sent",
        description: "A warning has been sent to the user about community guidelines.",
      });
    },
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyForm.content.trim() || !replyForm.nickname.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both content and nickname.",
        variant: "destructive",
      });
      return;
    }
    addReplyMutation.mutate(replyForm);
  };

  const handleDeleteReply = (replyId: number) => {
    deleteReplyMutation.mutate(replyId);
    // Also send a warning
    sendWarningMutation.mutate({
      replyId,
      reason: "Your reply was removed for violating community guidelines. Please review our guidelines and be respectful in future interactions."
    });
  };

  const getCategoryStyle = (category: string) => {
    const categoryObj = MESSAGE_CATEGORIES.find(cat => cat.name === category);
    return categoryObj?.color || "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-medium mb-2">Message not found</h2>
            <p className="text-muted-foreground mb-4">This message may have been removed or doesn't exist.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuidelines(true)}
            className="flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            Community Guidelines
          </Button>
        </div>

        {/* Main Message */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`${getCategoryStyle(message.category)} border`}>
                  {message.category}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {message.createdAt ? new Date(message.createdAt).toLocaleDateString() : "Unknown date"}
                  </span>
                  {message.spotifyLink && (
                    <span className="flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      Spotify Track
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-lg leading-relaxed mb-4">{message.content}</p>
            {message.spotifyLink && (
              <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Spotify Track</span>
                </div>
                <a
                  href={message.spotifyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline break-all"
                >
                  {message.spotifyLink}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Replies Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Replies ({message.replies.length})
            </h2>
          </div>

          {/* Reply Form */}
          <Card id="reply-form">
            <CardHeader>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ReplyIcon className="w-5 h-5" />
                {replyForm.parentId ? "Reply to Comment" : "Add Your Reply"}
              </h3>
              {replyForm.parentId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Replying to a comment</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyForm(prev => ({ 
                      ...prev, 
                      parentId: null, 
                      mentionedUserId: null, 
                      mentionedAdminId: null,
                      content: ""
                    }))}
                  >
                    Cancel Reply
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div>
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={replyForm.nickname}
                    onChange={(e) => setReplyForm({ ...replyForm, nickname: e.target.value })}
                    placeholder={user ? `Replying as: ${user.username}` : admin ? `Replying as: ${admin.displayName}` : "Enter a nickname"}
                    disabled={!!(user || admin)}
                    className={(user || admin) ? "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Your Reply</Label>
                  <Textarea
                    id="content"
                    value={replyForm.content}
                    onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                    placeholder="Share your thoughts respectfully..."
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please follow our community guidelines when replying
                  </p>
                  <Button type="submit" disabled={addReplyMutation.isPending}>
                    {addReplyMutation.isPending ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Threaded Replies List with connecting lines */}
          <div className="space-y-4">
            {message.replies.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No replies yet. Be the first to share your thoughts!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {message.replies.map((reply: Reply, index) => (
                  <div key={reply.id} className="relative">
                    {/* Threading line connector */}
                    {index < message.replies.length - 1 && (
                      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border opacity-30" />
                    )}
                    
                    <Card className="relative ml-0">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-3">
                            {/* Threading connector dot */}
                            <div className="relative flex-shrink-0">
                              <div className="w-3 h-3 rounded-full bg-primary/20 border-2 border-primary/40 mt-1" />
                              {index > 0 && (
                                <div className="absolute top-0 left-1.5 w-0.5 h-2 bg-border -translate-y-2" />
                              )}
                            </div>
                            
                            {/* Avatar */}
                            {reply.userId && (reply as ReplyWithUser).user && (
                              <Avatar className="w-8 h-8">
                                <AvatarImage 
                                  src={(reply as ReplyWithUser).user?.profilePicture || undefined} 
                                  alt={(reply as ReplyWithUser).user?.displayName || (reply as ReplyWithUser).user?.username}
                                />
                                <AvatarFallback className="bg-blue-600 text-white text-sm">
                                  {((reply as ReplyWithUser).user?.displayName || (reply as ReplyWithUser).user?.username || reply.nickname).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {reply.adminId && (reply as ReplyWithUser).admin && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-purple-600 text-white text-sm">
                                  {((reply as ReplyWithUser).admin?.displayName || reply.nickname).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {!reply.userId && !reply.adminId && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-gray-600 text-white text-sm">
                                  {reply.nickname.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{reply.nickname}</span>
                                {/* Show admin permission tag */}
                                {reply.adminId && (
                                  <Badge variant="outline" className="text-xs px-2 py-0 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Whisper Listener
                                  </Badge>
                                )}
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {reply.createdAt ? formatTimeAgo(reply.createdAt) : "Unknown date"}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{reply.content}</p>
                              
                              {/* Reply actions */}
                              <div className="flex items-center gap-2 mt-2 text-sm">
                                <button
                                  onClick={() => {
                                    const mentionText = `@${reply.nickname} `;
                                    setReplyForm(prev => ({
                                      ...prev,
                                      content: mentionText,
                                      parentId: reply.id,
                                      mentionedUserId: reply.userId,
                                      mentionedAdminId: reply.adminId
                                    }));
                                    // Scroll to reply form
                                    document.querySelector('#reply-form')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                >
                                  <ReplyIcon className="w-3 h-3" />
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {admin && (
                            <div className="flex items-center gap-2 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteReplyId(reply.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Community Guidelines Dialog */}
        <AlertDialog open={showGuidelines} onOpenChange={setShowGuidelines}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Community Guidelines
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-left">
                  <p>Welcome to Whisper Network! To maintain a safe and supportive environment for all Silent Messengers, please follow these guidelines:</p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">✓ Be Respectful</h4>
                      <p className="text-sm text-gray-600">Treat everyone with kindness and respect. Different perspectives are welcome.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">✗ No Bullying or Harassment</h4>
                      <p className="text-sm text-gray-600">Any form of bullying, harassment, or personal attacks will not be tolerated.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">✗ No NSFW Content</h4>
                      <p className="text-sm text-gray-600">Keep all content appropriate for all ages. No explicit sexual content or graphic violence.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">✗ No Hate Speech</h4>
                      <p className="text-sm text-gray-600">Discriminatory language based on race, gender, religion, sexual orientation, or other characteristics is prohibited.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">✓ Constructive Communication</h4>
                      <p className="text-sm text-gray-600">Aim to be helpful and constructive in your responses. Offer support when possible.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">✗ No Spam or Self-Promotion</h4>
                      <p className="text-sm text-gray-600">Avoid repetitive content or excessive self-promotion.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">🔒 Privacy Respect</h4>
                      <p className="text-sm text-gray-600">Don't share personal information or try to identify anonymous users.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Remember:</strong> Whisper Listeners are here to help maintain a safe space. 
                      Violations may result in content removal and warnings. Repeated violations may lead to restricted access.
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Reply Confirmation */}
        <AlertDialog open={!!deleteReplyId} onOpenChange={() => setDeleteReplyId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Delete Reply & Send Warning
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the reply and send a warning message to the user about community guidelines. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteReplyId && handleDeleteReply(deleteReplyId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete & Warn User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}