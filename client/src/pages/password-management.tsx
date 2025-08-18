import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PasswordManager, ZEKE001PasswordViewer } from "@/components/password-manager";
import { useAuth } from "@/hooks/use-auth";
import { User, Shield, Lock, Key } from "lucide-react";

export function PasswordManagementPage() {
  const { user, admin } = useAuth();

  if (!user && !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You need to be logged in to access password management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentUser = user || admin;
  const isAdmin = !!admin;
  const isZEKE001 = admin?.username === "ZEKE001";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Key className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Password Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account security and password settings
          </p>
        </div>

        {/* Account Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Shield className="h-5 w-5 text-purple-600" />
                  Whisper Listener Account
                </>
              ) : (
                <>
                  <User className="h-5 w-5 text-blue-600" />
                  Silent Messenger Account
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Username
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-900 dark:text-gray-100">
                    {currentUser?.username}
                  </span>
                  {isAdmin && (
                    <Badge 
                      variant="outline" 
                      className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Whisper Listener
                    </Badge>
                  )}
                  {isZEKE001 && (
                    <Badge 
                      variant="outline" 
                      className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                    >
                      <Key className="w-3 h-3 mr-1" />
                      ADMIN
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Account Type
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {isZEKE001 ? "Super Administrator" : isAdmin ? "Whisper Listener" : "Silent Messenger"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Management Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              Security Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <PasswordManager />
                {isZEKE001 && <ZEKE001PasswordViewer />}
              </div>
              
              {isZEKE001 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    ZEKE001 Admin Privileges
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    As ZEKE001, you have special administrative privileges including the ability to view all user passwords and change your password without entering the current one.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Security Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Use a strong password with at least 8 characters including numbers and special characters</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Never share your password with anyone, even other administrators</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Change your password regularly, especially if you suspect it may have been compromised</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Use different passwords for different accounts and services</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}