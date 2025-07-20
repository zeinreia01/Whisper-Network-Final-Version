import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCard } from "@/components/message-card";
import { AdminManagement } from "@/components/admin-management";
import { UserManagement } from "@/components/user-management";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Users, MessageCircle, Heart, Zap, LogOut, Lock, Settings } from "lucide-react";
import { useLocation } from "wouter";
import type { MessageWithReplies } from "@shared/schema";

export default function Admin() {
  const [selectedRecipient, setSelectedRecipient] = useState("Admin");
  const { admin, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Always call hooks before any early returns
  const { data: recipients = [] } = useQuery<string[]>({
    queryKey: ["/api/recipients"],
    enabled: !!admin,
  });

  const { data: privateMessages = [], isLoading: loadingPrivate } = useQuery<MessageWithReplies[]>({
    queryKey: ["/api/messages/recipient", selectedRecipient],
    enabled: !!selectedRecipient && !!admin,
  });

  const { data: publicMessages = [], isLoading: loadingPublic } = useQuery<MessageWithReplies[]>({
    queryKey: ["/api/messages/public"],
    enabled: !!admin,
  });

  const makePublicMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest("PATCH", `/api/messages/${messageId}`, { isPublic: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Message made public",
        description: "The message is now visible to everyone.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to make message public.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Early return after all hooks
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-light mb-2">Whisper Listener Access Required</h2>
            <p className="text-gray-600 mb-4">Please sign in as a Whisper Listener to access this panel.</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalReplies = publicMessages.reduce((sum, msg) => sum + msg.replies.length, 0);
  const activeUsers = new Set(publicMessages.map(msg => msg.replies.map(r => r.nickname)).flat()).size;

  const stats = [
    {
      title: "Private Messages",
      value: privateMessages.length,
      icon: MessageCircle,
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Public Messages", 
      value: publicMessages.length,
      icon: Users,
      color: "bg-accent/10 text-accent"
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: Heart,
      color: "bg-yellow-500/10 text-yellow-600"
    },
    {
      title: "Total Replies",
      value: totalReplies,
      icon: Zap,
      color: "bg-purple-500/10 text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Whisper Listener Dashboard</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Private messages from Silent Messengers and community guidance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="admin-management" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Admin Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Private Messages</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Filter by recipient:</span>
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map((recipient) => (
                          <SelectItem key={recipient} value={recipient}>
                            {recipient}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
            {loadingPrivate ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading private messages...</p>
              </div>
            ) : privateMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No private messages for {selectedRecipient} yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {privateMessages.map((message) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-6">
                    <MessageCard message={message} showReplies={false} />
                    <div className="flex items-center space-x-4 mt-4">
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => {
                          // TODO: Implement private reply functionality
                          toast({
                            title: "Feature coming soon",
                            description: "Private reply functionality will be added soon.",
                          });
                        }}
                      >
                        Reply Privately
                      </Button>
                      <Button 
                        className="bg-accent hover:bg-accent/90"
                        onClick={() => makePublicMutation.mutate(message.id)}
                        disabled={makePublicMutation.isPending}
                      >
                        Make Public
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // TODO: Implement archive functionality
                          toast({
                            title: "Feature coming soon",
                            description: "Archive functionality will be added soon.",
                          });
                        }}
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-management" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="admin-management" className="mt-6">
            <AdminManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}