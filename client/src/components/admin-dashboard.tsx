import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Admin, MessageWithReplies } from "@shared/schema";
import { Loader2, Plus, ToggleLeft, ToggleRight } from "lucide-react";

export function AdminDashboard() {
  const { admin } = useAuth();
  const { toast } = useToast();
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    displayName: "",
    role: "admin",
  });

  // Fetch private messages
  const { data: privateMessages, isLoading: loadingPrivateMessages } = useQuery({
    queryKey: ["/api/messages/private"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/private");
      return await response.json();
    },
  });

  // Fetch all admins
  const { data: allAdmins, isLoading: loadingAdmins } = useQuery({
    queryKey: ["/api/admin/list"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/list");
      return await response.json();
    },
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (adminData: typeof newAdmin) => {
      const response = await apiRequest("POST", "/api/admin/create", adminData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipients"] });
      setNewAdmin({ username: "", password: "", displayName: "", role: "admin" });
      toast({
        title: "Success",
        description: "Admin account created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Make message public mutation
  const makePublicMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/messages/${messageId}/visibility`, { isPublic: true });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/private"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      toast({
        title: "Success",
        description: "Message published successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ adminId, isActive }: { adminId: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/${adminId}/status`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipients"] });
      toast({
        title: "Success",
        description: "Admin status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAdminMutation.mutateAsync(newAdmin);
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Badge variant="secondary">
          {admin.displayName} ({admin.role})
        </Badge>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">Private Messages</TabsTrigger>
          <TabsTrigger value="admins">Manage Admins</TabsTrigger>
          <TabsTrigger value="create">Create Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Private Messages</CardTitle>
              <CardDescription>Review and publish private messages</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPrivateMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : privateMessages?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No private messages pending review.</p>
              ) : (
                <div className="space-y-4">
                  {privateMessages?.map((message: MessageWithReplies) => (
                    <Card key={message.id} className="border-l-4 border-l-orange-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <Badge variant="outline">{message.category}</Badge>
                            {message.recipient && (
                              <Badge variant="secondary">To: {message.recipient}</Badge>
                            )}
                            <p className="text-sm text-gray-600">
                              {message.senderName ? `From: ${message.senderName}` : "Anonymous"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => makePublicMutation.mutate(message.id)}
                            disabled={makePublicMutation.isPending}
                          >
                            {makePublicMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Make Public"
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-900 mb-2">{message.content}</p>
                        {message.spotifyLink && (
                          <a
                            href={message.spotifyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            🎵 Spotify Link
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Accounts</CardTitle>
              <CardDescription>Manage admin accounts and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {allAdmins?.map((adminUser: Admin) => (
                    <Card key={adminUser.id} className="border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{adminUser.displayName}</h3>
                            <p className="text-sm text-gray-600">@{adminUser.username}</p>
                            <Badge variant="outline">{adminUser.role}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              {adminUser.isActive ? "Active" : "Inactive"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleAdminMutation.mutate({
                                  adminId: adminUser.id,
                                  isActive: !adminUser.isActive,
                                })
                              }
                              disabled={toggleAdminMutation.isPending || adminUser.username === "ZEKE001"}
                            >
                              {adminUser.isActive ? (
                                <ToggleRight className="h-5 w-5 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Admin</CardTitle>
              <CardDescription>Add a new admin account to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newAdmin.username}
                      onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={newAdmin.displayName}
                      onChange={(e) => setNewAdmin({ ...newAdmin, displayName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="community_manager">Community Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createAdminMutation.isPending}>
                  {createAdminMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Admin
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}