import { useState, useEffect } from "react";
import { MessageCard } from "@/components/message-card";
import { CategoryFilter } from "@/components/category-filter";
import { SearchBar } from "@/components/search-bar";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { MessageWithReplies } from "@shared/schema";

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageWithReplies[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: messages = [], isLoading, error, refetch } = useQuery<MessageWithReplies[]>({
    queryKey: ["/api/messages/public"],
    queryFn: async () => {
      console.log('Fetching public messages...');
      const response = await apiRequest('GET', '/api/messages/public');
      if (!response.ok) {
        console.error('Failed to fetch messages:', response.status, response.statusText);
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      console.log('Fetched messages:', data.length);
      return data;
    },
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/messages/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset category when searching
  useEffect(() => {
    if (searchQuery) {
      setActiveCategory("all");
    }
  }, [searchQuery]);

  const displayMessages = searchQuery 
    ? searchResults 
    : (activeCategory === "all" 
        ? messages 
        : messages.filter(message => message.category === activeCategory));

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">Community Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A place where voices unite and hearts connect
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search messages by content, category, or sender..."
            className="max-w-2xl mx-auto"
          />
          {searchQuery && (
            <div className="text-center mt-4">
              <Badge variant="secondary" className="text-sm bg-muted text-muted-foreground">
                {isSearching 
                  ? "Searching..." 
                  : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                }
              </Badge>
            </div>
          )}
        </div>

        {/* Category Filter - only show when not searching */}
        {!searchQuery && (
          <CategoryFilter 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        )}

        {isLoading || isSearching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {isSearching ? "Searching messages..." : "Loading messages..."}
            </p>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No messages found for "${searchQuery}". Try different keywords.`
                : (activeCategory === "all" 
                    ? "No messages yet. Be the first to share!" 
                    : "No messages in this category yet.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayMessages.map((message) => (
              <MessageCard key={message.id} message={message} showReplies={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}