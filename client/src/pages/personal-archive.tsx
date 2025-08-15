import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCard } from "@/components/message-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Bookmark, ArrowLeft, Heart } from "lucide-react";
import type { MessageWithReplies } from "@shared/schema";

export function PersonalArchivePage() {
  const { user, admin } = useAuth();

  const { data: likedMessages, isLoading, error } = useQuery({
    queryKey: [`/api/users/${user?.id || admin?.id}/liked-messages`],
    queryFn: async (): Promise<MessageWithReplies[]> => {
      const userId = user?.id || admin?.id;
      if (!userId) throw new Error("Not authenticated");
      
      const params = new URLSearchParams();
      if (user) params.append('userId', userId.toString());
      if (admin) params.append('adminId', userId.toString());
      
      const response = await fetch(`/api/users/${userId}/liked-messages?${params}`);
      if (!response.ok) throw new Error("Failed to fetch liked messages");
      return response.json();
    },
    enabled: !!(user || admin),
  });

  if (!user && !admin) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-500/10 rounded-full">
              <Bookmark className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white page-title">Authentication Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to be logged in as a Silent Messenger to view your personal archive.
            </p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full">
                  <Bookmark className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900 dark:text-white page-title">Personal Archive</h1>
                  <p className="text-gray-600 dark:text-gray-400">Your saved messages</p>
                </div>
              </div>
            </div>
            <Link href="/personal">
              <Button variant="outline" className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                Personal Settings
              </Button>
            </Link>
          </div>

          {/* Stats Card */}
          <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Archive Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {likedMessages?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Saved Messages</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {likedMessages?.reduce((acc, msg) => acc + msg.replies.length, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Replies</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {likedMessages?.reduce((acc, msg) => acc + (msg.reactionCount || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Hearts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          {isLoading && (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-lg">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2 bg-gray-200 dark:bg-gray-600" />
                    <Skeleton className="h-4 w-1/2 mb-4 bg-gray-200 dark:bg-gray-600" />
                    <Skeleton className="h-20 w-full bg-gray-200 dark:bg-gray-600" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 shadow-lg">
              <CardContent className="p-6 text-center">
                <p className="text-red-700 dark:text-red-400 mb-4">Failed to load your archived messages</p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline" 
                  className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && (!likedMessages || likedMessages.length === 0) && (
            <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-500/10 rounded-full">
                  <Bookmark className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No saved messages yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start saving messages to your personal archive by clicking the bookmark button on messages you want to keep.
                </p>
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Browse Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && likedMessages && likedMessages.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Saved Messages ({likedMessages.length})
                </h2>
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white self-start sm:self-center">
                  {user ? 'Silent Messenger' : 'Whisper Listener'}: {user?.username || admin?.displayName}
                </Badge>
              </div>
              {likedMessages.map((message) => (
                <MessageCard 
                  key={message.id} 
                  message={message} 
                  showReplies={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonalArchivePage;