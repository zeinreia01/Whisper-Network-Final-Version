import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Lock, Key, Eye, EyeOff } from "lucide-react";
import { changePasswordSchema, adminChangePasswordSchema } from "@shared/schema";
import type { ChangePassword, AdminChangePassword } from "@shared/schema";

export function PasswordManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const { user, admin } = useAuth();
  const { toast } = useToast();

  const isUser = !!user;
  const isAdmin = !!admin;
  const isZEKE001 = admin?.username === "ZEKE001";

  const changePasswordForm = useForm<ChangePassword | AdminChangePassword>({
    resolver: zodResolver(isAdmin ? adminChangePasswordSchema : changePasswordSchema),
    defaultValues: {
      currentPassword: isZEKE001 ? undefined : "",
      newPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword | AdminChangePassword) => {
      const endpoint = isUser 
        ? `/api/users/${user.id}/change-password`
        : `/api/admins/${admin?.id}/change-password`;
      
      return await apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      changePasswordForm.reset();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChangePassword | AdminChangePassword) => {
    changePasswordMutation.mutate(data);
  };

  if (!user && !admin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lock className="h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        
        <Form {...changePasswordForm}>
          <form onSubmit={changePasswordForm.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Password Field - Skip for ZEKE001 */}
            {!isZEKE001 && (
              <FormField
                control={changePasswordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your current password"
                        {...field}
                        data-testid="input-current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* New Password Field */}
            <FormField
              control={changePasswordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your new password (min 6 characters)"
                      {...field}
                      data-testid="input-new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isZEKE001 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <Key className="h-4 w-4 inline mr-1" />
                  As ZEKE001, you can change your password without entering your current password.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel-password"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                data-testid="button-change-password"
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ZEKE001 Special Component - View All Passwords
export function ZEKE001PasswordViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [passwordData, setPasswordData] = useState<any>(null);
  const { admin } = useAuth();
  const { toast } = useToast();

  const viewPasswordsMutation = useMutation({
    mutationFn: async () => {
      console.log("Fetching all passwords for ZEKE001...");
      const response = await apiRequest("POST", "/api/admin/view-all-passwords", {
        adminUsername: "ZEKE001"
      });
      console.log("Password data response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("Setting password data:", data);
      setPasswordData(data);
      toast({
        title: "Password Data Retrieved",
        description: "All user and admin password data has been loaded.",
      });
    },
    onError: (error: any) => {
      console.error("Password viewer error:", error);
      toast({
        title: "Access Denied",
        description: error.message || "Only ZEKE001 can access this feature.",
        variant: "destructive",
      });
    },
  });

  // Only show for ZEKE001
  if (admin?.username !== "ZEKE001") return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
          <Eye className="h-4 w-4" />
          View All Passwords (ZEKE001)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Eye className="h-5 w-5" />
            ZEKE001 Password Management
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              ⚠️ CRITICAL ADMIN FEATURE - This shows all user passwords (hashed). Handle with extreme care.
            </p>
          </div>

          {!passwordData ? (
            <Button
              onClick={() => viewPasswordsMutation.mutate()}
              disabled={viewPasswordsMutation.isPending}
              className="w-full"
              data-testid="button-load-passwords"
            >
              {viewPasswordsMutation.isPending ? "Loading..." : "Load All Password Data"}
            </Button>
          ) : (
            <div className="space-y-6">
              {/* Users Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Users ({passwordData.users?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {passwordData.users?.map((user: any) => (
                      <div key={user.id} className="p-3 border rounded-md">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">ID:</span> {user.id}</div>
                          <div><span className="font-medium">Username:</span> {user.username}</div>
                          <div className="col-span-2">
                            <span className="font-medium">Display Name:</span> {user.displayName || "None"}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Hashed Password:</span>
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1 block break-all">
                              {user.hashedPassword || "No password found"}
                            </code>
                          </div>
                          <div className="col-span-2 text-xs text-gray-500">
                            Created: {new Date(user.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Admins Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admins ({passwordData.admins?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {passwordData.admins?.map((admin: any) => (
                      <div key={admin.id} className="p-3 border rounded-md">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">ID:</span> {admin.id}</div>
                          <div><span className="font-medium">Username:</span> {admin.username}</div>
                          <div className="col-span-2">
                            <span className="font-medium">Display Name:</span> {admin.displayName || "None"}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Hashed Password:</span>
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1 block break-all">
                              {admin.hashedPassword || "No password set"}
                            </code>
                          </div>
                          <div className="col-span-2 text-xs text-gray-500">
                            Created: {new Date(admin.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}