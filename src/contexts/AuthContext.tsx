import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  authenticateDriva,
  createGuestUser,
  syncDrivaUser,
  verifyAuth,
} from "../services/api";

interface User {
  id: string; // userId from sales-copilot
  email: string;
  name: string;
  drivaUserId?: string; // userId from Driva auth
  jwt?: string; // JWT token from Driva
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  skipLogin: () => Promise<User>;
  ensureUser: () => Promise<User>; // Ensures a user exists (creates guest if needed)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "mind_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log("=== initAuth started ===");
      const storedUser = localStorage.getItem(STORAGE_KEY);
      console.log("storedUser from localStorage:", storedUser);

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("parsedUser:", parsedUser);

        // If user has drivaUserId (was logged in), verify session cookie is still valid
        if (parsedUser.drivaUserId) {
          console.log("Verifying session with current-user...");
          const verifiedUser = await verifyAuth();
          console.log("verifiedUser result:", verifiedUser);

          if (verifiedUser) {
            // Sync user with sales-copilot to ensure they exist
            const syncedUser = await syncDrivaUser(
              verifiedUser.id,
              verifiedUser.email,
              verifiedUser.name
            );

            // Session is valid, update user with fresh data from API
            const updatedUser: User = {
              id: syncedUser.id, // Use the sales-copilot userId
              email: verifiedUser.email,
              name: verifiedUser.name, // Fresh name from API
              drivaUserId: verifiedUser.id,
              jwt: verifiedUser.jwt,
            };
            setUser(updatedUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            console.log("User verified and updated:", updatedUser.name);
          } else {
            // Session is invalid, clear auth
            console.log("Session invalid or expired");
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          // Guest user, just use stored data
          console.log("Guest user, using stored data");
          setUser(parsedUser);
        }
      } else {
        console.log("No stored user found");
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 1. Authenticate with Driva API
      const authResponse = await authenticateDriva(email, password);

      // 2. Sync user with sales-copilot backend (creates or updates user with drivaUserId as messagingId)
      const syncedUser = await syncDrivaUser(
        authResponse.id,
        authResponse.email,
        authResponse.name
      );

      // 3. Update user state
      const userData: User = {
        id: syncedUser.id, // Use the sales-copilot userId
        email: authResponse.email,
        name: authResponse.name,
        drivaUserId: authResponse.id,
        jwt: authResponse.jwt,
      };

      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const skipLogin = async () => {
    try {
      // Create a guest user in the backend
      const guestResponse = await createGuestUser("Visitante");

      const guestUser: User = {
        id: guestResponse.id,
        email: "",
        name: guestResponse.name || "Visitante",
      };

      setUser(guestUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
      return guestUser;
    } catch (error) {
      console.error("Error creating guest user:", error);
      // Fallback to local guest user if API fails
      const fallbackUser: User = {
        id: `local_${Date.now()}`,
        email: "",
        name: "Visitante",
      };
      setUser(fallbackUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  // Ensures a user exists - creates guest user if needed
  const ensureUser = async (): Promise<User> => {
    if (user) {
      return user;
    }
    return await skipLogin();
  };

  const isGuest = !!user && !user.drivaUserId;

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isGuest,
        login,
        logout,
        skipLogin,
        ensureUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
