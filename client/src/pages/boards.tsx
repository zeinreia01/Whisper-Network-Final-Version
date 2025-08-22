import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Search, Users, Flag, Trash2, Eye, EyeOff, Star } from "lucide-react";
import type { User, Admin } from "@shared/schema";
import { AdSenseContainer } from "@/components/google-adsense-modal";

interface BoardUser extends User {
  messageCount: number;
  lastMessageDate?: string;
}

interface BoardAdmin extends Admin {
  messageCount: number;
  lastMessageDate?: string;
}

type BoardData = BoardUser | BoardAdmin;

export default function Boards() {
  const { user, admin } = useAuth();
  const { toast } = useToast();
  
  const [boards, setBoards] = useState<BoardData[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<BoardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedBoard, setSelectedBoard] = useState<BoardData | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    // Filter boards based on search query
    if (searchQuery.trim() === "") {
      setFilteredBoards(boards);
    } else {
      const filtered = boards.filter(board => {
        const searchLower = searchQuery.toLowerCase();
        const boardName = (board as any).boardName || `${board.displayName || board.username}'s Board`;
        const displayName = board.displayName || board.username;
        const bio = board.bio || "";
        
        return (
          boardName.toLowerCase().includes(searchLower) ||
          displayName.toLowerCase().includes(searchLower) ||
          bio.toLowerCase().includes(searchLower)
        );
      });
      setFilteredBoards(filtered);
    }
  }, [searchQuery, boards]);

  const loadBoards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/boards/all");
      if (response.ok) {
        const data = await response.json();
        // Sort by message count (descending)
        const sortedBoards = data.sort((a: BoardData, b: BoardData) => b.messageCount - a.messageCount);
        setBoards(sortedBoards);
        setFilteredBoards(sortedBoards);
      }
    } catch (error) {
      console.error("Error loading boards:", error);
      toast({
        title: "Error",
        description: "Failed to load boards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportBoard = async () => {
    if (!selectedBoard || !reportReason.trim()) return;

    try {
      const reportData = {
        targetUserId: 'role' in selectedBoard ? null : selectedBoard.id,
        targetAdminId: 'role' in selectedBoard ? selectedBoard.id : null,
        reason: reportReason,
        reporterId: user?.id || admin?.id,
        reporterType: user ? 'user' : 'admin',
        type: 'board'
      };

      const response = await fetch("/api/reports/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        toast({
          title: "Report submitted",
          description: "Your report has been sent to the administrators for review.",
        });
        setShowReportDialog(false);
        setReportReason("");
        setSelectedBoard(null);
      } else {
        throw new Error("Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBoard = async (board: BoardData) => {
    try {
      const endpoint = 'role' in board ? `/api/admins/${board.id}/board` : `/api/users/${board.id}/board`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Board deleted successfully",
        });
        loadBoards(); // Reload boards
      } else {
        throw new Error("Failed to delete board");
      }
    } catch (error) {
      console.error("Error deleting board:", error);
      toast({
        title: "Error",
        description: "Failed to delete board",
        variant: "destructive",
      });
    }
  };

  const getBoardUrl = (board: BoardData) => {
    return `/board/${board.username}`;
  };

  const getBoardProfilePicture = (board: BoardData) => {
    // Use board-specific profile picture if set, otherwise use user's profile picture
    return (board as any).boardProfilePicture || board.profilePicture;
  };

  const getBoardName = (board: BoardData) => {
    return (board as any).boardName || `${board.displayName || board.username}'s Board`;
  };

  const isOwnBoard = (board: BoardData) => {
    return (user && user.id === board.id) || (admin && admin.id === board.id);
  };

  const canDeleteBoard = (board: BoardData) => {
    return isOwnBoard(board) || admin; // Own board or is admin
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Users className="w-8 h-8" />
              Boards
              <Badge variant="destructive" className="text-xs font-bold">NEW!</Badge>
            </h1>
            <p className="text-muted-foreground">
              Discover community boards where users share their thoughts and connect
            </p>
          </div>
          
          {/* Search */}
          <div className="mt-4 sm:mt-0 sm:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{boards.length}</p>
                  <p className="text-sm text-muted-foreground">Total Boards</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {boards.reduce((sum, board) => {
                      const count = typeof board.messageCount === 'number' ? board.messageCount : parseInt(board.messageCount?.toString() || '0', 10) || 0;
                      return sum + count;
                    }, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredBoards.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Filtered" : "Active"} Boards
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Google AdSense Inline */}
        <AdSenseContainer pageType="boards" />

        {/* Boards Grid */}
        {filteredBoards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "No boards found" : "No boards available"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search terms"
                  : "Be the first to create a board by setting up your profile!"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBoards.map((board) => (
              <Card 
                key={`${board.id}-${'role' in board ? 'admin' : 'user'}`}
                className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden border-2 hover:border-primary/20"
              >
                {/* Background Banner */}
                {(board as any).boardBanner && (
                  <div 
                    className="h-24 bg-cover bg-center"
                    style={{ backgroundImage: `url(${(board as any).boardBanner})` }}
                  />
                )}
                
                <CardContent className="p-4">
                  {/* Profile Section */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className={`w-12 h-12 ring-2 ring-white shadow-lg ${(board as any).boardBanner ? '-mt-8' : ''}`}>
                      <AvatarImage 
                        src={getBoardProfilePicture(board) || ""} 
                        alt={board.displayName || board.username} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                        {(board.displayName || board.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {getBoardName(board)}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        by {board.displayName || board.username}
                        {'role' in board && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            {board.role}
                          </Badge>
                        )}
                        {board.isVerified && (
                          <span className="ml-1">✓</span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Report Button */}
                      {!isOwnBoard(board) && (user || admin) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedBoard(board);
                            setShowReportDialog(true);
                          }}
                        >
                          <Flag className="w-3 h-3" />
                        </Button>
                      )}

                      {/* Delete Button */}
                      {canDeleteBoard(board) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Board</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this board? This will remove all messages and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteBoard(board)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Board
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {board.bio && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {board.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {typeof board.messageCount === 'number' ? board.messageCount : parseInt(board.messageCount?.toString() || '0', 10) || 0} messages
                    </div>
                    {'role' in board && (
                      <Badge variant="secondary" className="text-xs">
                        Listener
                      </Badge>
                    )}
                  </div>

                  {/* Visit Button */}
                  <Link href={getBoardUrl(board)}>
                    <Button 
                      className="w-full text-xs h-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Board
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Board</DialogTitle>
              <DialogDescription>
                Report this board to administrators for review. Please provide a clear reason for your report.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe why you're reporting this board..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleReportBoard}
                  disabled={!reportReason.trim()}
                >
                  Submit Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}