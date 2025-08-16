import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { User, Shield, MessageCircle, Calendar, Search, Trash2 } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { User as UserType, Admin, MessageWithReplies } from "@shared/schema";

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  admin: Admin | null;
}

export function UserAccountModal({ isOpen, onClose, user, admin }: UserAccountModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  // Get user's sent messages
  const { data: userMessages = [], isLoading: loadingMessages } = useQuery<MessageWithReplies[]>({
    queryKey: ["/api/user/messages", user?.id],
    enabled: !!user && isOpen,
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        return await apiRequest("DELETE", `/api/users/${user.id}/account`, {
          adminUsername: "ZEKE001" // Only ZEKE001 can delete accounts
        });
      } else if (admin) {
        return await apiRequest("DELETE", `/api/admins/${admin.id}/account`, {
          adminUsername: "ZEKE001" // Only ZEKE001 can delete accounts
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      logout();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredMessages = userMessages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentUser = user || admin;
  if (!currentUser) return null;

  const isAdmin = !!admin;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isAdmin ? (
              <>
                <Shield className="w-5 h-5 text-purple-600" />
                <span>Whisper Listener Account</span>
              </>
            ) : (
              <>
                <User className="w-5 h-5 text-primary" />
                <span>Silent Messenger Account</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Username</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-gray-900 dark:text-gray-100">{currentUser.username}</span>
                    {isAdmin && (
                      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                        <Shield className="w-3 h-3 mr-1" />
                        Whisper Listener
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">
                    {formatTimeAgo(currentUser.createdAt!)}
                  </p>
                </div>
                {isAdmin && 'role' in currentUser && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1 capitalize">{currentUser.role}</p>
                  </div>
                )}
                {isAdmin && 'displayName' in currentUser && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{currentUser.displayName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages History (for Silent Messengers) */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Your Messages ({userMessages.length})</span>
                </CardTitle>
                {userMessages.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search your messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredMessages.length > 0 ? (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {filteredMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4 hover:bg-muted">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {message.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(message.createdAt!)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2 line-clamp-3">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                          </span>
                          <Badge variant={message.isPublic ? "default" : "outline"} className="text-xs">
                            {message.isPublic ? "Public" : "Private"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>
                      {searchTerm
                        ? "No messages found matching your search"
                        : "You haven't sent any messages yet"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-700 mb-4">
                    This action cannot be undone. This will permanently delete your account
                    {user ? " and all your messages." : " and remove your admin access."}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAccountMutation.mutate()}
                    disabled={deleteAccountMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}