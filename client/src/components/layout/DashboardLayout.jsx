import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "../../styles/Dashboard.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;

    // Try to get cached user first
    try {
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setLoading(false);
      }
    } catch (err) {
      console.warn("Failed to read cached user:", err);
    }

    // Then verify with server
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });
        
        if (!res.ok) {
          throw new Error(res.status === 401 ? "unauthorized" : "server_error");
        }

        const data = await res.json();
        if (!cancel) {
          setUser(data.user);
          try {
            localStorage.setItem("user", JSON.stringify(data.user));
          } catch (err) {
            console.warn("Failed to cache user:", err);
          }
        }
      } catch (err) {
        if (!cancel) {
          if (err.message === "unauthorized") {
            setUser(null);
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
          } else {
            console.error("Auth check failed:", err);
          }
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [navigate]);

  // Restrict barista access
  useEffect(() => {
    if (!user) return;
    if (user.role === "manager") return;

    const path = location.pathname.toLowerCase();
    const allowed = ["/pos", "/customers"];
    const allowedPrefixes = ["/pos/checkout", "/pos/checkout/receipt"];

    const isAllowed =
      allowed.includes(path) || allowedPrefixes.some((p) => path.startsWith(p));

    if (!isAllowed) navigate("/pos", { replace: true });
  }, [user, location.pathname, navigate]);

  const link = ({ isActive }) => ({
    padding: "0.5em 0.8em",
    borderRadius: 8,
    textDecoration: "none",
    color: "#000000",
    background: isActive ? "rgba(0, 101, 153, 0.18)" : "transparent",
  });

  const handleSignOut = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (signingOut) return;
      setSigningOut(true);

      try {
        const res = await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!res.ok) {
          throw new Error("Logout request failed");
        }
      } catch (err) {
        console.warn("Logout failed:", err);
      } finally {
        // Always clear local state even if server logout fails
        setUser(null);
        try {
          localStorage.removeItem("user");
        } catch (err) {
          console.warn("Failed to clear user:", err);
        }

        setSigningOut(false);
        navigate("/login", { replace: true });
      }
    },
    [signingOut, navigate]
  );

  return (
    <div className="dashboard">
      <header className="header">
        <h1>blue52</h1>
        <div className="notifications">{/* your notification SVG */}</div>
        <div className="profile">
          <div className="profile-name">
            <p>{user?.name || ""}</p>
            <p>
              {user?.role
                ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                : ""}
            </p>
          </div>
          {/* profile icon SVG */}
        </div>
      </header>

      <div className="container">
        <aside className="navbar">
          <nav>
            <NavLink to="/pos" end style={link}>
              <div>POS</div>
            </NavLink>
            <NavLink to="/customers" style={link}>
              Customers
            </NavLink>

            {user?.role === "manager" && (
              <>
                <NavLink to="/inventory" style={link}>
                  Inventory
                </NavLink>
                <NavLink to="/analytics" style={link}>
                  Analytics
                </NavLink>
                <NavLink to="/admin" style={link}>
                  Admin
                </NavLink>
                <NavLink to="/menu" style={link}>
                  Menu
                </NavLink>
              </>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="signout"
              style={{
                display: "block",
                padding: "0.5em 0.8em",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                textAlign: "left",
                cursor: signingOut ? "default" : "pointer",
                opacity: signingOut ? 0.6 : 1,
              }}
              disabled={signingOut}
              aria-busy={signingOut ? "true" : "false"}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        </aside>

        <main>{loading ? <p>Loading...</p> : <Outlet />}</main>
      </div>
    </div>
  );
}
