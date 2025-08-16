
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { KeyRound, Mail, Lock } from "lucide-react";

interface PasswordResetFormProps {
  resetToken?: string;
  username?: string;
  onSuccess?: () => void;
}

export function PasswordResetForm({ resetToken, username, onSuccess }: PasswordResetFormProps) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const forgotPasswordMutation = useMutation({
    mutationFn: async (emailAddress: string) => {
      return await apiRequest("POST", "/api/auth/forgot-password", {
        email: emailAddress
      });
    },
    onSuccess: () => {
      toast({
        title: "Reset Email Sent",
        description: "If an account with that email exists, a password reset link has been sent.",
      });
      setEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      return await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: password
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    forgotPasswordMutation.mutate(email);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!resetToken) {
      toast({
        title: "Error",
        description: "Invalid reset token",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ token: resetToken, password: newPassword });
  };

  if (resetToken) {
    // Show password reset form
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Reset Password</span>
          </CardTitle>
          {username && (
            <p className="text-sm text-gray-600">
              Resetting password for: <strong>{username}</strong>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
                minLength={6}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
            >
              {resetPasswordMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Resetting Password...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4" />
                  <span>Reset Password</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Show forgot password form
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Forgot Password</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Enter your verified email address to receive a password reset link.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={forgotPasswordMutation.isPending}
            />
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Note: Only verified email addresses can receive password reset links. 
              If you haven't verified your email yet, please do so first.
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={forgotPasswordMutation.isPending || !email}
          >
            {forgotPasswordMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Sending Reset Link...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Send Reset Link</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
