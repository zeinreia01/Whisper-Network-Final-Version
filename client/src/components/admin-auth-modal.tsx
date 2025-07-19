import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Shield } from "lucide-react";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAuthModal({ isOpen, onClose }: AdminAuthModalProps) {
  const [form, setForm] = useState({ username: "", password: "" });
  const { loginAdmin, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAdmin(form.username, form.password);
      onClose();
      setForm({ username: "", password: "" });
    } catch (error) {
      // Error is handled in the auth hook
    }
  };

  const handleClose = () => {
    onClose();
    setForm({ username: "", password: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Whisper Listener Access
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-username">Username</Label>
            <Input
              id="admin-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter listener username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter listener password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Sign In as Whisper Listener
          </Button>
        </form>


      </DialogContent>
    </Dialog>
  );
}