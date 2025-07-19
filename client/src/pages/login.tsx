import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Lock } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Try new admin system first
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password }),
      });

      if (response.ok) {
        const admin = await response.json();
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminData", JSON.stringify(admin));
        toast({
          title: "Welcome back!",
          description: `Logged in as ${admin.nickname}`,
        });
        navigate("/admin");
      } else if (password === "admin123") {
        // Fallback to simple password check
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminData", JSON.stringify({ nickname: "Admin", role: "admin" }));
        toast({
          title: "Welcome back!",
          description: "You are now logged in as admin.",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Access denied",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Fallback to simple password check
      if (password === "admin123") {
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminData", JSON.stringify({ nickname: "Admin", role: "admin" }));
        toast({
          title: "Welcome back!",
          description: "You are now logged in as admin.",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Access denied",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
      }
    }

    setIsLoading(false);
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-light">Admin Login</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Enter your admin password to access private messages
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}