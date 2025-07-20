import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCard } from "@/components/message-card";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, User, MessageSquare, Heart, Calendar } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { UserProfile, MessageWithReplies } from "@shared/schema";

export function UserProfilePage() {
  const { id } = useParams();
  const { user, admin } = useAuth();
  const userId = parseInt(id || "0");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${userId}/profile`],
    enabled: !!userId && (!!user || !!admin),
  });

  const { data: userMessages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/messages`],
    enabled: !!userId && (!!user || !!admin),
  });

  // Redirect if not authenticated
  if (!user && !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-300 mb-6">You need to be logged in to view user profiles.</p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Card className="bg-gray-800/50 border-gray-700 mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-gray-300 mb-6">The user profile you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Profile header */}
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-2xl text-white flex items-center space-x-2">
                    <User className="w-6 h-6" />
                    <span>{profile.username}</span>
                  </CardTitle>
                  <p className="text-gray-400 flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {formatTimeAgo(profile.createdAt!)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-center text-primary mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.messageCount}</div>
                  <div className="text-sm text-gray-400">Messages</div>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-center text-green-500 mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.replyCount}</div>
                  <div className="text-sm text-gray-400">Replies</div>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-center text-red-500 mb-2">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.totalReactions}</div>
                  <div className="text-sm text-gray-400">Hearts Received</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User's messages */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Public Messages ({userMessages?.length || 0})
            </h2>
            
            {messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userMessages && userMessages.length > 0 ? (
              <div className="space-y-6">
                {userMessages.map((message: MessageWithReplies) => (
                  <MessageCard 
                    key={message.id} 
                    message={message} 
                    showReplies={false}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Public Messages</h3>
                  <p className="text-gray-500">This user hasn't posted any public messages yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}