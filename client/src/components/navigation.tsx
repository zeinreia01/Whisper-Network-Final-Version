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
import { User, Shield, LogOut, Settings, Home, BarChart3, Menu, Archive, Search, Bell } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const { user, admin, logout } = useAuth();

  return (
    <>
      {/* Top Navigation Bar - Minimal and Clean */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  localStorage.removeItem('hasVisitedWhisperingNetwork');
                  window.location.reload();
                }}
                className="text-xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer tracking-tight hover:text-purple-600 transition-colors lowercase"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                whisper network
              </button>
            </div>

            {/* Right side - Search and User Menu */}
            <div className="flex items-center space-x-3">
              {/* Global search for authenticated users - Desktop only */}
              {(user || admin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex h-10 px-3 rounded-full"
                  onClick={() => setShowGlobalSearch(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="ml-2">Search</span>
                </Button>
              )}

              {/* User authentication section */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10 px-3 rounded-full">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">{user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
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
                    <Button variant="ghost" size="sm" className="h-10 px-3 rounded-full">
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">{admin.displayName}</span>
                      <Badge variant="outline" className="hidden sm:inline-flex ml-2 text-xs">
                        Listener
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <Link href="/admin-profile">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 px-3 rounded-full hidden sm:flex" 
                    onClick={() => setShowAuthModal(true)}
                  >
                    <User className="h-4 w-4" />
                    <span className="ml-2">Silent Messenger</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 px-3 rounded-full hidden sm:flex" 
                    onClick={() => setShowAdminAuthModal(true)}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="ml-2">Whisper Listener</span>
                  </Button>
                  
                  {/* Mobile login menu */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0">
                          <Menu className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 mt-2">
                        <DropdownMenuItem onClick={() => setShowAuthModal(true)}>
                          <User className="h-4 w-4 mr-2" />
                          Silent Messenger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowAdminAuthModal(true)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Whisper Listener
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 sm:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Home */}
          <Link href="/">
            <button
              className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[64px] transition-all duration-200 ${
                location === "/"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              data-testid="tab-home"
            >
              <Home className={`h-6 w-6 ${location === "/" ? "scale-110" : ""} transition-transform`} />
              <span className="text-xs mt-1 font-medium">Home</span>
            </button>
          </Link>

          {/* Dashboard */}
          <Link href="/dashboard">
            <button
              className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[64px] transition-all duration-200 ${
                location === "/dashboard"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              data-testid="tab-dashboard"
            >
              <BarChart3 className={`h-6 w-6 ${location === "/dashboard" ? "scale-110" : ""} transition-transform`} />
              <span className="text-xs mt-1 font-medium">Dashboard</span>
            </button>
          </Link>

          {/* Search - for authenticated users */}
          {(user || admin) && (
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="flex flex-col items-center justify-center p-3 rounded-xl min-w-[64px] transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              data-testid="tab-search"
            >
              <Search className="h-6 w-6 transition-transform" />
              <span className="text-xs mt-1 font-medium">Search</span>
            </button>
          )}

          {/* Notifications - for authenticated users */}
          {(user || admin) && (
            <div className="flex flex-col items-center justify-center">
              <NotificationCenter />
            </div>
          )}

          {/* Admin Dashboard - for admins only */}
          {admin && (
            <Link href="/admin">
              <button
                className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[64px] transition-all duration-200 ${
                  location === "/admin"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                data-testid="tab-admin"
              >
                <Shield className={`h-6 w-6 ${location === "/admin" ? "scale-110" : ""} transition-transform`} />
                <span className="text-xs mt-1 font-medium">Admin</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <AdminAuthModal isOpen={showAdminAuthModal} onClose={() => setShowAdminAuthModal(false)} />
      <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
    </>
  );
}