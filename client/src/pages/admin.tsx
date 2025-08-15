import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCard } from "@/components/message-card";
import { AdminManagement } from "@/components/admin-management";
import { UserManagement } from "@/components/user-management";
import { VerificationManagement } from "@/components/verification-management";
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-light mb-2">Whisper Listener Access Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in as a Whisper Listener to access this panel.</p>
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
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground break-words page-title">Whisper Network Admin</h1>
            </div>
            <div className="flex-shrink-0">
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 min-w-[80px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Private messages from Silent Messengers and community guidance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="min-w-0">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className={`p-2 rounded-lg ${stat.color} flex-shrink-0 self-start sm:self-center`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{stat.value}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="messages" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 min-w-[400px]">
              <TabsTrigger value="messages" className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm min-h-[44px]">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="user-management" className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm min-h-[44px]">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Users</span>
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm min-h-[44px]">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Verify</span>
              </TabsTrigger>
              <TabsTrigger value="admin-management" className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm min-h-[44px]">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Admin</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="messages" className="mt-4 sm:mt-6">
            <Card>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Private Messages</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filter by recipient:</span>
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger className="w-full sm:w-48">
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
              <div className="space-y-4 sm:space-y-6">
                {privateMessages.map((message) => (
                  <div key={message.id} className="border border-border rounded-lg p-4 sm:p-6">
                    <MessageCard message={message} showReplies={false} />
                    <div className="flex flex-col xs:flex-row gap-2 mt-4">
                      <Button 
                        size="sm"
                        className="bg-primary hover:bg-primary/90 flex-1 xs:flex-none min-h-[40px]"
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
                        size="sm"
                        className="bg-accent hover:bg-accent/90 flex-1 xs:flex-none min-h-[40px]"
                        onClick={() => makePublicMutation.mutate(message.id)}
                        disabled={makePublicMutation.isPending}
                      >
                        Make Public
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="flex-1 xs:flex-none min-h-[40px]"
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

          <TabsContent value="user-management" className="mt-4 sm:mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="verification" className="mt-4 sm:mt-6">
            <VerificationManagement />
          </TabsContent>

          <TabsContent value="admin-management" className="mt-4 sm:mt-6">
            <AdminManagement />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}