import { useEffect, useState } from "react";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { getAccessToken, clearTokens } from "./lib/storage";

export function App() {
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  useEffect(() => {
    if (!token) {
      clearTokens();
    }
  }, [token]);

  if (!token) {
    return <LoginPage onLogin={setToken} />;
  }

  return <DashboardPage token={token} onLogout={() => setToken(null)} />;
}
