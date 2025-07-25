import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Plus, X, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface HonorableMention {
  id: number;
  name: string;
  emoji?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface HonorableMentionsModalProps {
  trigger?: React.ReactNode;
}

export function HonorableMentionsModal({ trigger }: HonorableMentionsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<HonorableMention | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const { admin } = useAuth();
  const queryClient = useQueryClient();

  // Query to fetch honorable mentions
  const { data: mentions = [], isLoading } = useQuery<HonorableMention[]>({
    queryKey: ['/api/honorable-mentions'],
    enabled: isOpen,
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (data: { name: string; emoji?: string }) => 
      fetch('/api/honorable-mentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/honorable-mentions'] });
      setNewName("");
      setNewEmoji("");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; emoji?: string } }) => 
      fetch(`/api/honorable-mentions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/honorable-mentions'] });
      setEditingItem(null);
      setIsEditing(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/honorable-mentions/${id}`, {
        method: 'DELETE',
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/honorable-mentions'] });
    },
  });

  const handleAdd = () => {
    if (newName.trim()) {
      addMutation.mutate({
        name: newName.trim(),
        emoji: newEmoji.trim() || undefined,
      });
    }
  };

  const handleUpdate = () => {
    if (editingItem && editingItem.name.trim()) {
      updateMutation.mutate({
        id: editingItem.id,
        data: {
          name: editingItem.name.trim(),
          emoji: editingItem.emoji?.trim() || undefined,
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to remove this person from the honorable mentions?')) {
      deleteMutation.mutate(id);
    }
  };

  const startEditing = (mention: HonorableMention) => {
    setEditingItem({ ...mention });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="bg-white/80 dark:bg-gray-800/80 pink:bg-pink-50/80 hover:bg-white dark:hover:bg-gray-700 pink:hover:bg-pink-100 border border-gray-200 dark:border-gray-700 pink:border-pink-200 text-gray-700 dark:text-gray-300 pink:text-pink-700 backdrop-blur-sm"
          >
            <Heart className="w-4 h-4 mr-2 text-red-500" />
            Honorable Mentions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 pink:bg-pink-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100 pink:text-pink-900">
            <Heart className="w-6 h-6 inline mr-2 text-red-500" />
            Honorable Mentions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Gratitude Message */}
          <div className="text-center space-y-4 p-6 bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-800 dark:to-gray-700 pink:from-pink-100 pink:to-pink-200 rounded-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 pink:text-pink-900 mb-4">
              Special Thanks To:
            </h3>
            <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 pink:text-pink-800">
              From the depths of my heart, I want to express my profound gratitude to these incredible souls 
              who believed in this vision, offered their unwavering support, and helped bring Whisper Network to life.
            </p>
            <p className="text-base text-gray-700 dark:text-gray-300 pink:text-pink-700">
              Your encouragement, inspiration, and kindness made this sanctuary of anonymous connection possible. 
              Each of you holds a special place in this journey, and your influence resonates through every whisper shared here.
            </p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 pink:text-pink-600">
              With endless appreciation and love,
            </p>
            <p className="text-lg font-semibold text-primary">
              ~ Zeke
            </p>
          </div>

          {/* Mentions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Loading mentions...
              </div>
            ) : mentions.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No mentions yet
              </div>
            ) : (
              mentions.map((mention) => (
                <div
                  key={mention.id}
                  className="bg-white dark:bg-gray-800 pink:bg-pink-100 border border-gray-200 dark:border-gray-700 pink:border-pink-200 rounded-lg p-3 text-center relative group hover:shadow-md transition-all"
                >
                  {isEditing && editingItem?.id === mention.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingItem.emoji || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, emoji: e.target.value })}
                        placeholder="Emoji"
                        className="text-center text-xs"
                        maxLength={5}
                      />
                      <Input
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        placeholder="Name"
                        className="text-center text-sm"
                      />
                      <div className="flex justify-center space-x-1">
                        <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl mb-1">{mention.emoji || "💝"}</div>
                      <div className="font-medium text-sm text-gray-800 dark:text-gray-200 pink:text-pink-800">
                        {mention.name}
                      </div>
                      
                      {/* Admin edit/delete buttons */}
                      {admin && admin.username === 'ZEKE001' && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={() => startEditing(mention)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                            onClick={() => handleDelete(mention.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add new mention form (only for ZEKE001) */}
          {admin && admin.username === 'ZEKE001' && (
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100 pink:text-pink-900">
                Add New Mention
              </h4>
              <div className="flex space-x-2">
                <Input
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="Emoji (optional)"
                  className="w-20"
                  maxLength={5}
                />
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd} disabled={!newName.trim() || addMutation.isPending}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}