import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Lock, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { changePasswordSchema, adminChangePasswordSchema } from "@shared/schema";
import type { ChangePassword, AdminChangePassword } from "@shared/schema";
import { Badge } from "@/components/ui/badge";


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
  const [showPasswords, setShowPasswords] = useState(false);
  const { admin } = useAuth();
  const { toast } = useToast();

  const { data: userPasswords, isLoading: loadingPasswords, error: passwordError } = useQuery({
    queryKey: ["/api/admin/passwords"],
    enabled: !!admin && (admin.role === "super_admin" || admin.username === "ZEKE001"),
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/passwords");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user passwords: ${errorText}`);
      }
      return response.json();
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Only show for ZEKE001 or Super Admin
  if (admin?.username !== "ZEKE001" && admin?.role !== "super_admin") return null;

  if (loadingPasswords) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            User Passwords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading passwords...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (passwordError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            User Passwords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Failed to load passwords</p>
            <p className="text-sm text-muted-foreground">{passwordError.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
          <Eye className="h-4 w-4" />
          View All Passwords ({admin?.username === "ZEKE001" ? "ZEKE001" : "Super Admin"})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Eye className="h-5 w-5" />
            {admin?.username === "ZEKE001" ? "ZEKE001" : "Super Admin"} Password Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              ⚠️ CRITICAL ADMIN FEATURE - This shows all user passwords. Handle with extreme care.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="flex items-center space-x-2">
              <EyeOff className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Show Unhashed Passwords</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswords(!showPasswords)}
              className={showPasswords ? "bg-red-100 border-red-300 text-red-700" : ""}
            >
              {showPasswords ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>

          {userPasswords ? (
            <div className="space-y-6">
              {/* Users Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Users ({userPasswords.users?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userPasswords.users?.map((user: any) => (
                      <div key={user.id} className="p-3 border rounded-md">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">ID:</span> {user.id}</div>
                          <div><span className="font-medium">Username:</span> {user.username}</div>
                          <div className="col-span-2">
                            <span className="font-medium">Display Name:</span> {user.displayName || "None"}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">{showPasswords ? 'Password:' : 'Hashed Password:'}</span>
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1 block break-all">
                              {showPasswords 
                                ? (user.unhashed || "Password unavailable") 
                                : (user.hashedPassword || "No password found")
                              }
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
                  <CardTitle className="text-lg">Admins ({userPasswords.admins?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userPasswords.admins?.map((admin: any) => (
                      <div key={admin.id} className="p-3 border rounded-md">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">ID:</span> {admin.id}</div>
                          <div><span className="font-medium">Username:</span> {admin.username}</div>
                          <div className="col-span-2">
                            <span className="font-medium">Display Name:</span> {admin.displayName || "None"}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">{showPasswords ? 'Password:' : 'Hashed Password:'}</span>
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1 block break-all">
                              {showPasswords 
                                ? (admin.unhashed || "Password unavailable") 
                                : (admin.hashedPassword || "No password set")
                              }
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No password data available.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}