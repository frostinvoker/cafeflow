// src/hooks/useDashboardLayout.js
import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useDashboardLayout({
  apiBase = "http://localhost:5000",
  allowedPaths = ["/pos", "/customers"],
  allowedPrefixes = ["/pos/checkout", "/pos/checkout/receipt"],
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth gate
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("unauth");
        const data = await res.json();
        if (!cancel) {
          setUser(data.user);
          try {
            localStorage.setItem("user", JSON.stringify(data.user));
          } catch {}
        }
      } catch {
        if (!cancel) navigate("/login", { replace: true });
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [apiBase, navigate]);

  // Role guard (restrict barista)
  useEffect(() => {
    if (!user) return;
    if (user.role === "manager") return;
    const path = location.pathname.toLowerCase();
    const isAllowed =
      allowedPaths.includes(path) ||
      allowedPrefixes.some((p) => path.startsWith(p));
    if (!isAllowed) navigate("/pos", { replace: true });
  }, [user, location.pathname, navigate, allowedPaths, allowedPrefixes]);

  // Active NavLink style
  const link = ({ isActive }) => ({
    padding: "0.5em 0.8em",
    textDecoration: "none",
    borderRadius: "15px",
    color: isActive ? "#2563EB" : "#000000",
    background: isActive ? "#F1F5F9" : "transparent",
  });

  // Logout
  const handleSignOut = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (signingOut) return;
      setSigningOut(true);
      try {
        await fetch(`${apiBase}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      } catch {
      } finally {
        try {
          localStorage.removeItem("user");
        } catch {}
        setSigningOut(false);
        try {
          navigate("/login", { replace: true });
        } catch {
          window.location.assign("/login");
        }
      }
    },
    [signingOut, navigate, apiBase]
  );

  return { user, loading, signingOut, link, handleSignOut };
}
