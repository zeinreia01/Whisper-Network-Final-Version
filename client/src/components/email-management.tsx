
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";

export function EmailManagement() {
  const [email, setEmail] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addEmailMutation = useMutation({
    mutationFn: async (emailAddress: string) => {
      if (!user) throw new Error("User not authenticated");
      return await apiRequest("POST", `/api/users/${user.id}/add-email`, {
        email: emailAddress
      });
    },
    onSuccess: async () => {
      toast({
        title: "Verification Email Sent",
        description: "Check your inbox and click the verification link to earn your verified badge!",
      });
      setEmail("");
      // Refresh user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    },
  });

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    addEmailMutation.mutate(email);
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Email Verification</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.email ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                {user.emailVerified ? (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                    {user.isVerified && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified Badge Earned
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending Verification
                  </Badge>
                )}
              </div>
            </div>
            
            {!user.emailVerified && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please check your inbox and click the verification link to verify your email and earn your verified badge.
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleAddEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={addEmailMutation.isPending}
              />
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Earn Your Verified Badge</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    Add and verify your email to automatically receive a verified badge and enable password reset functionality.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={addEmailMutation.isPending || !email}
            >
              {addEmailMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Sending Verification Email...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Add Email & Get Verified</span>
                </div>
              )}
            </Button>
          </form>
        )}
        
        <div className="pt-3 border-t">
          <h5 className="font-medium text-sm mb-2">Benefits of Email Verification:</h5>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Automatic verified badge</li>
            <li>• Password reset capability</li>
            <li>• Enhanced account security</li>
            <li>• Important account notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
