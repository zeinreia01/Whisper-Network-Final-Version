import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AuthModal } from "@/components/auth-modal";
import { AdminAuthModal } from "@/components/admin-auth-modal";
import { GlobalSearch } from "@/components/global-search";
import { NotificationCenter } from "@/components/notification-center";
import { useAuth } from "@/hooks/use-auth";
import { User, Shield, LogOut, Settings, Home, BarChart3, Menu, Archive, Search } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const { user, admin, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Public Dashboard" },
  ];

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo section - moved closer to center on mobile */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 cursor-pointer tracking-tight">
                  Whispering Network
                </h2>
              </Link>
            </div>
            
            {/* Navigation items - responsive design */}
            <div className="flex items-center space-x-1">
              {/* Desktop navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <button
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        location === item.path
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
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
              </div>

              {/* Mobile navigation */}
              <div className="flex md:hidden items-center space-x-0.5">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <button
                      className={`p-2 rounded-md transition-all duration-200 ${
                        location === item.path
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      title={item.label}
                    >
                      {item.path === "/" ? <Home className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                    </button>
                  </Link>
                ))}
                
                {admin && (
                  <Link href="/admin">
                    <button
                      className={`p-2 rounded-md transition-all duration-200 ${
                        location === "/admin"
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      title="Whisper Listener"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                  </Link>
                )}
              </div>
              
              {/* Global search for authenticated users */}
              {(user || admin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 sm:px-3"
                  onClick={() => setShowGlobalSearch(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Search</span>
                </Button>
              )}
              
              {/* Notifications for authenticated users */}
              {(user || admin) && <NotificationCenter />}
              
              {/* User authentication section */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">{user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <Link href={`/user/${user.id}`}>
                      <DropdownMenuItem>
                        <User className="h-4 w-4 mr-2" />
                        View My Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/personal">
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Personal Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/personal-archive">
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Personal Archive
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : admin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3">
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">{admin.displayName}</span>
                      <Badge variant="outline" className="hidden sm:inline-flex ml-2 text-xs">
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-2 sm:px-3" 
                    onClick={() => setShowAuthModal(true)}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Silent Messenger</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-2 sm:px-3" 
                    onClick={() => setShowAdminAuthModal(true)}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Whisper Listener</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <AdminAuthModal isOpen={showAdminAuthModal} onClose={() => setShowAdminAuthModal(false)} />
      <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
    </>
  );
}
