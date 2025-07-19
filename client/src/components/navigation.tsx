import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AuthModal } from "@/components/auth-modal";
import { AdminAuthModal } from "@/components/admin-auth-modal";
import { useAuth } from "@/hooks/use-auth";
import { User, Shield, LogOut, Settings } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const { user, admin, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Public Dashboard" },
  ];

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <Link href="/">
                <h2 className="text-lg font-medium text-gray-900 cursor-pointer tracking-tight">
                  Whispering Network
                </h2>
              </Link>
            </div>
            
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      location === item.path
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                </Link>
              ))}
              
              {admin && (
                <Link href="/admin">
                  <button
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      location === "/admin"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Whisper Listener
                  </button>
                </Link>
              )}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3">
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : admin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3">
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{admin.displayName}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        Listener
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="h-9 px-3" onClick={() => setShowAuthModal(true)}>
                    Silent Messenger
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 px-3" onClick={() => setShowAdminAuthModal(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Whisper Listener</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <AdminAuthModal isOpen={showAdminAuthModal} onClose={() => setShowAdminAuthModal(false)} />
    </>
  );
}
