import { useState, useEffect, useCallback } from "react";
import { ChatContainer } from "./components/ChatContainer";
import { LoginModal } from "./components/LoginModal";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
  getChats,
  createChat,
  deleteChat,
  type ChatSession,
} from "./services/api";

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Load chats from backend when user is authenticated
  const loadChats = useCallback(async () => {
    if (!user?.drivaUserId) return;

    setIsLoadingChats(true);
    try {
      const chats = await getChats(user.drivaUserId);
      setChatHistory(chats);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user?.drivaUserId]);

  useEffect(() => {
    if (isAuthenticated && user?.drivaUserId) {
      loadChats();
    }
  }, [isAuthenticated, user?.drivaUserId, loadChats]);

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    // On mobile, close sidebar after selecting
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleChatStart = async (firstMessage: string) => {
    if (!user?.drivaUserId) return null;

    try {
      const title =
        firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "");
      const newChat = await createChat(user.drivaUserId, title);
      setChatHistory((prev) => [newChat, ...prev]);
      // Return the created chat ID so ChatContainer can use it
      return newChat.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await deleteChat(id);
      setChatHistory((prev) => prev.filter((chat) => chat.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-dvh bg-[#131314] overflow-hidden flex items-center justify-center">
        <LoginModal />
      </div>
    );
  }

  return (
    <div className="h-dvh bg-[#131314] overflow-hidden flex">
      {/* Sidebar */}
      <Sidebar
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isLoading={isLoadingChats}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenLogin={() => {}}
          sidebarOpen={sidebarOpen}
        />
        <ChatContainer
          key={currentChatId || "new"}
          chatId={currentChatId}
          onChatStart={handleChatStart}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
