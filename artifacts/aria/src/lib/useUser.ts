import { useState, useEffect } from "react";
import { getUser, loginUrl, logout as logoutApi } from "./api";

export interface ARIAUser {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  profileImage: string | null;
  plan: string;
  queryCount: number;
  createdAt: string;
}

export function useUser() {
  const [user, setUser] = useState<ARIAUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser()
      .then((data: { user: ARIAUser | null }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = (returnTo = "/app") => {
    window.location.href = loginUrl(returnTo);
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    window.location.href = "/";
  };

  return { user, loading, login, logout };
}
