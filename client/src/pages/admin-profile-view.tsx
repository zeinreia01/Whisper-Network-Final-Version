
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Shield, MessageCircle, Calendar, Star } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Admin } from "@shared/schema";

interface AdminProfileData extends Admin {
  messageCount: number;
  replyCount: number;
  totalReactions: number;
}

export function AdminProfileViewPage() {
  const { id } = useParams();
  const adminId = parseInt(id as string);

  const { data: adminProfile, isLoading, error } = useQuery<AdminProfileData>({
    queryKey: [`/api/admins/${adminId}/profile`],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${adminId}/profile`);
      if (!response.ok) throw new Error("Admin not found");
      return response.json();
    },
    enabled: !!adminId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !adminProfile) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Admin Not Found</h2>
              <p className="text-gray-600">The requested admin profile could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="grid gap-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <CardTitle>Whisper Listener Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Avatar className="w-20 h-20 border-4 border-purple-200 dark:border-purple-600">
                  <AvatarImage src={adminProfile.profilePicture || undefined} alt={adminProfile.displayName} />
                  <AvatarFallback className="bg-purple-600 text-white text-2xl font-semibold">
                    {adminProfile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {adminProfile.displayName}
                    </h1>
                    <Badge className="bg-purple-100 dark:bg-purple-600 text-purple-800 dark:text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      Whisper Listener
                    </Badge>
                    {adminProfile.isVerified && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Star className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {adminProfile.bio && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{adminProfile.bio}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Listener since {formatTimeAgo(adminProfile.createdAt!)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {adminProfile.messageCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Messages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {adminProfile.replyCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Replies</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {adminProfile.totalReactions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reactions Received</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfileViewPage;
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Shield, Calendar, MessageSquare, Reply } from "lucide-react";
import { Link } from "wouter";
import { UserBadge } from "@/components/user-badge";

interface Admin {
  id: number;
  username: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Message {
  id: number;
  content: string;
  category: string;
  isPublic: boolean;
  createdAt: string;
  reactionCount: number;
}

interface Reply {
  id: number;
  content: string;
  messageId: number;
  createdAt: string;
}

export function AdminProfileViewPage() {
  const { id } = useParams();
  const adminId = parseInt(id || "");

  const { data: admin, isLoading: adminLoading } = useQuery<Admin>({
    queryKey: ["admin", adminId],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${adminId}/profile`);
      if (!response.ok) {
        throw new Error("Admin not found");
      }
      return response.json();
    },
    enabled: !!adminId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["admin-messages", adminId],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${adminId}/messages`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!adminId,
  });

  const { data: replies, isLoading: repliesLoading } = useQuery<Reply[]>({
    queryKey: ["admin-replies", adminId],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${adminId}/replies`);
      if (!response.ok) {
        throw new Error("Failed to fetch replies");
      }
      return response.json();
    },
    enabled: !!adminId,
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Admin Not Found</h2>
              <p className="text-gray-600">The admin profile you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Admin Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={admin.profilePicture} alt={admin.displayName} />
                <AvatarFallback>{admin.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold truncate">{admin.displayName}</h1>
                  <UserBadge 
                    isVerified={admin.isVerified} 
                    isAdmin={true}
                  />
                </div>
                
                <p className="text-gray-600 text-sm mb-2">@{admin.username}</p>
                
                {admin.bio && (
                  <p className="text-gray-700 mb-4">{admin.bio}</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Whisper Listener</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(admin.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replies</CardTitle>
              <Reply className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{replies?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
              <span className="text-lg">❤️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {messages?.reduce((sum, msg) => sum + msg.reactionCount, 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.slice(0, 5).map((message) => (
                  <Link key={message.id} href={`/message/${message.id}`}>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{message.category}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={message.isPublic ? "default" : "outline"}>
                          {message.isPublic ? "Public" : "Private"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {message.reactionCount} reactions
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {messages.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    Showing 5 of {messages.length} messages
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No messages shared yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
