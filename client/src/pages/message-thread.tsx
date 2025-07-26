import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Info, Calendar, Music } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { MESSAGE_CATEGORIES } from "@shared/schema";
import { ThreadedReplies } from "@/components/threaded-replies";
import type { MessageWithReplies } from "@shared/schema";

export default function MessageThread() {
  const { id } = useParams();
  const [showGuidelines, setShowGuidelines] = useState(false);
  const { admin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: message, isLoading, error } = useQuery<MessageWithReplies>({
    queryKey: [`/api/messages/${id}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/messages/${id}`);
      if (!response.ok) {
        throw new Error('Message not found');
      }
      return await response.json();
    },
    enabled: !!id,
    retry: 3,
    retryDelay: 1000,
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
            <Button variant="outline" className="flex items-center gap-2 bg-background hover:bg-muted border-border">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuidelines(true)}
            className="flex items-center gap-2 bg-background hover:bg-muted border-border"
          >
            <Info className="w-4 h-4" />
            Community Guidelines
          </Button>
        </div>

        {/* Main Message */}
        <Card className={`mb-8 ${message.adminId ? 'border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : ''}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {message.adminId && (
                  <Badge className="bg-purple-600 text-white">
                    📢 Announcement
                  </Badge>
                )}
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

        {/* Replies Section with new ThreadedReplies system */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Thread Discussion ({message.replies.length}/500 replies)
            </h2>
          </div>

          {/* Always show ThreadedReplies component, even if no replies exist - it has the reply form */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">
                Discussion Thread
              </h3>
            </CardHeader>
            <CardContent>
              <ThreadedReplies
                replies={message.replies || []}
                messageId={message.id}
                messageUserId={message.userId ?? undefined}
                showAll={true}
                onWarning={(replyId) => {
                  sendWarningMutation.mutate({
                    replyId,
                    reason: "Your reply was flagged for violating community guidelines. Please review our guidelines and be respectful in future interactions."
                  });
                }}
              />
            </CardContent>
          </Card>
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
                      Each thread is limited to 500 replies to maintain readability.
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
      </div>
    </div>
  );
}