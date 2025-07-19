import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Shield, ShieldCheck, ShieldX } from "lucide-react";
import type { Admin } from "@shared/schema";

export function AdminManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("admin");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading } = useQuery<Admin[]>({
    queryKey: ["/api/admins"],
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; displayName: string; role: string }) => {
      return await apiRequest("POST", "/api/admins", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipients"] });
      setUsername("");
      setPassword("");
      setDisplayName("");
      setRole("admin");
      setShowCreateForm(false);
      toast({
        title: "Whisper Listener created!",
        description: "New Whisper Listener account has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create Whisper Listener account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleAdminStatusMutation = useMutation({
    mutationFn: async (data: { adminId: number; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admins/${data.adminId}`, { isActive: data.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipients"] });
      toast({
        title: "Whisper Listener status updated",
        description: "Whisper Listener account status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update Whisper Listener status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !displayName.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createAdminMutation.mutate({ username, password, displayName, role });
  };

  const handleToggleStatus = (adminId: number, currentStatus: boolean) => {
    toggleAdminStatusMutation.mutate({ adminId, isActive: !currentStatus });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "moderator":
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <ShieldX className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-700";
      case "moderator":
        return "bg-blue-500/10 text-blue-700";
      case "support":
        return "bg-green-500/10 text-green-700";
      case "community_manager":
        return "bg-purple-500/10 text-purple-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Whisper Listener Management
          </CardTitle>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create Whisper Listener
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <form onSubmit={handleCreateAdmin} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name for recipients"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="community_manager">Community Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createAdminMutation.isPending}
                className="flex items-center gap-2"
              >
                {createAdminMutation.isPending ? "Creating..." : "Create Whisper Listener"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading Whisper Listeners...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No Whisper Listener accounts found. Create the first account above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(admin.role)}
                    <div>
                      <p className="font-medium">{admin.nickname}</p>
                      <p className="text-sm text-gray-600">@{admin.username}</p>
                    </div>
                  </div>
                  <Badge className={getRoleColor(admin.role)}>
                    {admin.role.replace("_", " ")}
                  </Badge>
                  <Badge variant={admin.isActive ? "default" : "secondary"}>
                    {admin.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Button
                  onClick={() => handleToggleStatus(admin.id, admin.isActive)}
                  variant={admin.isActive ? "destructive" : "default"}
                  size="sm"
                  disabled={toggleAdminStatusMutation.isPending}
                >
                  {admin.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}