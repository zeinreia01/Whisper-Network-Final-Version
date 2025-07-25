import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { formatTimeAgo } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCard } from "@/components/message-card";
import { UserBadge } from "@/components/user-badge";
import { ArrowLeft, Settings, UserPlus, UserMinus, Calendar } from "lucide-react";
import type { Admin, MessageWithReplies } from "@shared/schema";

interface AdminProfile extends Admin {
  messageCount: number;
  replyCount: number;
  totalReactions: number;
  followersCount: number;
  isFollowing?: boolean;
}

export default function AdminProfile() {
  const params = useParams();
  // If no id in params, use current admin's id (for /admin-profile route)
  const adminId = params.id ? parseInt(params.id as string) : undefined;
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = user?.id;
  const currentAdminId = admin?.id;
  const targetAdminId = adminId || currentAdminId; // Use current admin if no id provided
  const isOwnProfile = targetAdminId === currentAdminId;

  const { data: profile, isLoading: profileLoading } = useQuery<AdminProfile>({
    queryKey: [`/api/admins/${targetAdminId}/profile`, currentUserId],
    queryFn: async () => {
      const url = `/api/admins/${targetAdminId}/profile${currentUserId ? `?currentUserId=${currentUserId}` : ''}`;
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    enabled: !!targetAdminId && targetAdminId > 0 && (!!user || !!admin),
  });

  const { data: adminMessages, isLoading: messagesLoading } = useQuery<MessageWithReplies[]>({
    queryKey: [`/api/admins/${targetAdminId}/messages`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admins/${targetAdminId}/messages`);
      return await response.json();
    },
    enabled: !!targetAdminId && (!!user || !!admin),
  });

  // Follow/Unfollow mutation for admin
  const followMutation = useMutation({
    mutationFn: async ({ targetId, action }: { targetId: number; action: 'follow' | 'unfollow' }) => {
      const endpoint = action === 'follow' ? `/api/admins/${targetId}/follow` : `/api/admins/${targetId}/unfollow`;
      const response = await apiRequest('POST', endpoint, {
        followerId: currentUserId
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} admin`);
      }
      return response.json();
    },
    onSuccess: (_, { action }) => {
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: [`/api/admins/${adminId}/profile`] });
      queryClient.refetchQueries({ queryKey: [`/api/admins/${adminId}/profile`] });
      toast({
        title: action === 'unfollow' ? "Unfollowed" : "Now Following",
        description: action === 'unfollow'
          ? `You unfollowed ${profile?.displayName}`
          : `You are now following ${profile?.displayName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    if (!currentUserId) return;
    const action = profile?.isFollowing ? 'unfollow' : 'follow';
    followMutation.mutate({ targetId: adminId, action });
  };

  if (profileLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Admin Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">The admin profile you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-white">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            {/* Profile header with background photo */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
              {/* Background Photo */}
              {profile.backgroundPhoto && (
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${profile.backgroundPhoto})` }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>
              )}
              
              <CardHeader className={profile.backgroundPhoto ? "-mt-16 relative z-10" : ""}>
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800 shadow-lg">
                      <AvatarImage 
                        src={profile.profilePicture || undefined} 
                        alt={profile.displayName || profile.username}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-2xl font-bold">
                        {(profile.displayName || profile.username || 'A').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className={`text-2xl flex items-center space-x-2 ${profile.backgroundPhoto ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <span>{profile.displayName || profile.username || 'Unknown Admin'}</span>
                        <UserBadge userType="admin" variant="small" />
                        {profile.isVerified && (
                          <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </CardTitle>
                      {profile.displayName && profile.username && (
                        <p className={`${profile.backgroundPhoto ? 'text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>@{profile.username}</p>
                      )}
                      <p className={`flex items-center mt-1 text-sm ${profile.backgroundPhoto ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Calendar className="w-4 h-4 mr-1" />
                        Joined {profile.createdAt ? formatTimeAgo(profile.createdAt) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    {isOwnProfile ? (
                      <Link href="/admin-personal">
                        <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </Link>
                    ) : user ? (
                      <Button
                        onClick={handleFollow}
                        disabled={followMutation.isPending}
                        variant={profile.isFollowing ? "outline" : "default"}
                        className={
                          profile.isFollowing
                            ? "border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600"
                            : "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                        }
                      >
                        {followMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            {profile.isFollowing ? "Unfollowing..." : "Following..."}
                          </>
                        ) : profile.isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="mt-4">
                    <p className={`text-sm leading-relaxed ${profile.backgroundPhoto ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
                      {profile.bio}
                    </p>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.messageCount || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Messages</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.replyCount || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Replies</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.totalReactions || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reactions</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.followersCount || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                </CardContent>
              </Card>
            </div>

            {/* Messages */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {!adminMessages || adminMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No public messages yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminMessages.map((message) => (
                      <MessageCard
                        key={message.id}
                        message={message}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}