import { useState } from "react";
import { MessageCard } from "@/components/message-card";
import { CategoryFilter } from "@/components/category-filter";
import { useQuery } from "@tanstack/react-query";
import type { MessageWithReplies } from "@shared/schema";

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: messages = [], isLoading } = useQuery<MessageWithReplies[]>({
    queryKey: ["/api/messages/public"],
  });

  const filteredMessages = activeCategory === "all" 
    ? messages 
    : messages.filter(message => message.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Community Dashboard</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A place where voices unite and hearts connect
          </p>
        </div>

        <CategoryFilter 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {activeCategory === "all" 
                ? "No messages yet. Be the first to share!" 
                : "No messages in this category yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMessages.map((message) => (
              <MessageCard key={message.id} message={message} showReplies={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
