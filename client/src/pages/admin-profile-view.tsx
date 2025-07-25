
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, MessageSquare, MessageCircle, Calendar, User, Heart } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

interface Admin {
  id: number;
  username: string;
  displayName: string;
  profilePicture?: string;
  backgroundPhoto?: string;
  bio?: string;
  createdAt: string;
  role: string;
  isActive: boolean;
  isVerified?: boolean;
}

interface Message {
  id: number;
  content: string;
  category: string;
  createdAt: string;
  senderName: string;
  reactionCount?: number;
}

interface Reply {
  id: number;
  content: string;
  messageId: number;
  createdAt: string;
  nickname: string;
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

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-0">
            {/* Background Photo */}
            {admin.backgroundPhoto && (
              <div
                className="h-48 bg-cover bg-center rounded-t-lg"
                style={{ backgroundImage: `url(${admin.backgroundPhoto})` }}
              />
            )}
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className={`relative ${admin.backgroundPhoto ? '-mt-16' : ''}`}>
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={admin.profilePicture || undefined} alt={admin.displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xl font-semibold">
                      {admin.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {admin.displayName}
                    </h1>
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Whisper Listener
                    </Badge>
                    {admin.isVerified && (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">@{admin.username}</p>
                  {admin.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{admin.bio}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {formatTimeAgo(admin.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages ({messages?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="replies" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Replies ({replies?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages by {admin.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-16 w-full mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <Link key={message.id} href={`/message/${message.id}`}>
                        <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" size="sm">
                              {message.category}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatTimeAgo(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">
                            {message.content}
                          </p>
                          {message.reactionCount && message.reactionCount > 0 && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Heart className="w-4 h-4 mr-1" />
                              {message.reactionCount} reactions
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="replies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Replies by {admin.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {repliesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-16 w-full mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    ))}
                  </div>
                ) : replies && replies.length > 0 ? (
                  <div className="space-y-4">
                    {replies.map((reply) => (
                      <Link key={reply.id} href={`/message/${reply.messageId}`}>
                        <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <p className="text-gray-900 dark:text-gray-100 mb-2">
                            {reply.content}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Reply as {reply.nickname}</span>
                            <span>{formatTimeAgo(reply.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No replies found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminProfileViewPage;
