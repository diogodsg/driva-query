import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenLogin: () => void;
  sidebarOpen: boolean;
}

export function Header({
  onToggleSidebar,
  onOpenLogin,
  sidebarOpen,
}: HeaderProps) {
  const { isAuthenticated } = useAuth();

  return (
    <header className="flex items-center justify-between px-3 py-2 bg-[#131314]">
      <div className="flex items-center gap-3">
        {/* Menu button - only show when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Logo */}
        <span className="text-xl text-white">Mind</span>
      </div>

      {/* Right side - only show login button when not authenticated */}
      {!isAuthenticated && (
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLogin}
            className="px-4 py-1.5 text-sm text-white border border-gray-600 rounded-full hover:bg-gray-800 transition-colors"
          >
            Entrar
          </button>
        </div>
      )}
    </header>
  );
}
