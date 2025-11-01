import { useCallback, useState } from "react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

export function useLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useCallback(
    async ({ onSuccess } = {}) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        // be robust to non-JSON errors
        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          throw new Error(data?.message || "Login failed");
        }

        // persist minimal user (same as your current flow)
        try {
          if (data?.user)
            localStorage.setItem("user", JSON.stringify(data.user));
        } catch {}

        onSuccess?.(data?.user ?? null);
        return data?.user ?? null;
      } catch (e) {
        setError(e.message || "Network error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [email, password]
  );

  const logout = useCallback(async () => {
    // optional: call your backend logout if you have one
    try {
      await fetch(`${API_BASE}/auth/logout`, { credentials: "include" });
    } catch {}
    try {
      localStorage.removeItem("user");
    } catch {}
  }, []);

  return {
    // state
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    loading,
    showPassword,
    setShowPassword,
    // actions
    login,
    logout,
  };
}
