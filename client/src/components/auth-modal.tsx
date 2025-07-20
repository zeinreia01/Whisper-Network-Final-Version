import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, User, UserPlus, CheckCircle, XCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [activeTab, setActiveTab] = useState("login");
  const [usernameAvailability, setUsernameAvailability] = useState<{ available: boolean; message: string } | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const { login, register, isLoading } = useAuth();

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameAvailability(null);
      return;
    }
    
    setIsCheckingUsername(true);
    try {
      const response = await fetch(`/api/auth/check-username/${username}`);
      const result = await response.json();
      setUsernameAvailability(result);
    } catch (error) {
      setUsernameAvailability({ available: false, message: "Error checking username" });
    } finally {
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    if (activeTab === "register" && registerForm.username) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(registerForm.username);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [registerForm.username, activeTab]);
  
  // Reset username availability when changing tabs
  useEffect(() => {
    setUsernameAvailability(null);
    setIsCheckingUsername(false);
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm.username, loginForm.password);
      onClose();
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      // Error is handled in the auth hook
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      return;
    }
    try {
      await register(registerForm.username, registerForm.password);
      onClose();
      setRegisterForm({ username: "", password: "", confirmPassword: "" });
    } catch (error) {
      // Error is handled in the auth hook
    }
  };

  const handleClose = () => {
    onClose();
    setLoginForm({ username: "", password: "" });
    setRegisterForm({ username: "", password: "", confirmPassword: "" });
    setActiveTab("login");
    setUsernameAvailability(null);
    setIsCheckingUsername(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Silent Messenger Account</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Create an account to save your messages and use nicknames when replying
          </p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <div className="relative">
                  <Input
                    id="register-username"
                    value={registerForm.username}
                    onChange={(e) => {
                      setRegisterForm({ ...registerForm, username: e.target.value });
                      setUsernameAvailability(null);
                    }}
                    placeholder="Choose a username"
                    required
                  />
                  {isCheckingUsername && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-gray-400" />
                  )}
                  {usernameAvailability && !isCheckingUsername && (
                    <div className="absolute right-3 top-3">
                      {usernameAvailability.available ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
                {usernameAvailability && !isCheckingUsername && (
                  <p className={`text-xs ${usernameAvailability.available ? 'text-green-600' : 'text-red-600'}`}>
                    {usernameAvailability.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder="Create a password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              {registerForm.password !== registerForm.confirmPassword && registerForm.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={
                  isLoading || 
                  registerForm.password !== registerForm.confirmPassword ||
                  (usernameAvailability && !usernameAvailability.available) ||
                  isCheckingUsername
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Privacy Note:</strong> No email required. Your username keeps your messages organized 
            while maintaining anonymity. Only you can see your private messages.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}