import { useEffect, useState } from "react";
import { LoginPage } from "./features/auth/LoginPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { getCurrentUser } from "./lib/api";
import type { AuthUser } from "./lib/types";
import { getAccessToken, clearTokens } from "./lib/storage";

export function App() {
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      clearTokens();
      setUser(null);
      setIsLoadingUser(false);
      return;
    }

    let isMounted = true;
    setIsLoadingUser(true);

    getCurrentUser(token)
      .then((response) => {
        if (isMounted) {
          setUser(response.data.user);
        }
      })
      .catch(() => {
        clearTokens();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!token) {
    return <LoginPage onLogin={setToken} />;
  }

  if (isLoadingUser || !user) {
    return (
      <main className="center-state">
        <div className="loading-pulse" />
        <p>Loading portal</p>
      </main>
    );
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return <AdminDashboardPage token={token} onLogout={() => setToken(null)} />;
  }

  return <DashboardPage token={token} onLogout={() => setToken(null)} />;
}
