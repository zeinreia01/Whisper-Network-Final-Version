import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Admin } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  login: (username: string, password: string) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("whispering-user");
    const savedAdmin = localStorage.getItem("whispering-admin");
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("whispering-user");
      }
    }
    
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch (error) {
        localStorage.removeItem("whispering-admin");
      }
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      return await response.json();
    },
    onSuccess: (userData: User) => {
      setUser(userData);
      localStorage.setItem("whispering-user", JSON.stringify(userData));
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/admin-login", { username, password });
      return await response.json();
    },
    onSuccess: (adminData: Admin) => {
      setAdmin(adminData);
      localStorage.setItem("whispering-admin", JSON.stringify(adminData));
      toast({
        title: "Success",
        description: "Admin logged in successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Admin login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", { username, password });
      return await response.json();
    },
    onSuccess: (userData: User) => {
      setUser(userData);
      localStorage.setItem("whispering-user", JSON.stringify(userData));
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({ username, password });
    } finally {
      setIsLoading(false);
    }
  };

  const loginAdmin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await adminLoginMutation.mutateAsync({ username, password });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync({ username, password });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    localStorage.removeItem("whispering-user");
    localStorage.removeItem("whispering-admin");
    queryClient.clear();
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
  };

  const contextValue: AuthContextType = {
    user,
    admin,
    login,
    loginAdmin,
    register,
    logout,
    isLoading: isLoading || loginMutation.isPending || adminLoginMutation.isPending || registerMutation.isPending,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}