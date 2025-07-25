import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User, Users, MessageSquare, Shield } from "lucide-react";
import { Link } from "wouter";
import { formatTimeAgo } from "@/lib/utils";
import type { User as UserType } from "@shared/schema";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "messages">("users");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/search", searchQuery, activeTab],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: isOpen && searchQuery.length >= 2,
  });

  const handleUserClick = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Search className="w-5 h-5" />
            Global Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search for users, messages, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              autoFocus
            />
          </div>

          {/* Search Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("users")}
              className={`flex-1 ${
                activeTab === "users"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("messages")}
              className={`flex-1 ${
                activeTab === "messages"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search for users and content...</p>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Skeleton className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-3 w-48 bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults && activeTab === "users" ? (
              <div className="space-y-2">
                {searchResults.users?.length > 0 ? (
                  searchResults.users.map((user: UserType) => (
                    <Link key={user.id} href={`/user/${user.id}`} onClick={handleUserClick}>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profilePicture || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {user.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {user.displayName || user.username}
                            </span>
                            {user.displayName && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </span>
                            )}
                          </div>
                          {user.bio && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {user.bio}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Joined {user.createdAt ? formatTimeAgo(user.createdAt) : 'Unknown'}
                          </p>
                        </div>
                        <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found matching "{searchQuery}"</p>
                  </div>
                )}

                {/* Admin search results */}
                {searchResults.admins?.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-200 dark:border-gray-700">
                      Whisper Listeners
                    </div>
                    {searchResults.admins.map((admin: any) => (
                      <Link key={`admin-${admin.id}`} href={`/admin-profile-view/${admin.id}`} onClick={handleUserClick}>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={admin.profilePicture || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                              {admin.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {admin.displayName}
                              </span>
                              <Badge variant="outline" className="text-xs px-2 py-0 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                                <Shield className="h-3 w-3 mr-1" />
                                Whisper Listener
                              </Badge>
                            </div>
                            {admin.bio && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {admin.bio}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Joined {admin.createdAt ? formatTimeAgo(admin.createdAt) : 'Unknown'}
                            </p>
                          </div>
                          <Shield className="w-4 h-4 text-purple-400 dark:text-purple-500" />
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            ) : searchResults && activeTab === "messages" ? (
              <div className="space-y-2">
                {searchResults.messages?.length > 0 ? (
                  searchResults.messages.map((message: any) => (
                    <Link key={message.id} href={`/message/${message.id}`} onClick={handleUserClick}>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                          >
                            {message.category}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                          {message.content}
                        </p>
                        {message.senderName && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            by {message.senderName}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}