import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import "../../styles/Dashboard.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("unauth");
        const data = await res.json();
        if (!cancel) {
          setUser(data.user);
          try { localStorage.setItem("user", JSON.stringify(data.user)); } catch {}
        }
      } catch {
        if (!cancel) navigate("/login", { replace: true });
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [navigate]);

  // Redirect baristas away from restricted routes
  useEffect(() => {
    if (!user) return;
    // Treat anything other than explicit 'manager' as restricted
    if (user.role === 'manager') return;
    const path = location.pathname.toLowerCase();
    // Allowed for barista
    const allowed = ["/pos", "/customers"];
    const allowedPrefixes = ["/pos/checkout", "/pos/checkout/receipt"]; // nested POS routes
    const isAllowed = allowed.includes(path) || allowedPrefixes.some(p => path.startsWith(p));
    if (!isAllowed) {
      navigate("/pos", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const link = ({ isActive }) => ({
    padding: "0.5em 0.8em",
    borderRadius: 8,
    textDecoration: "none",
    color: "#000000",
    background: isActive ? "rgba(0, 101, 153, 0.18)" : "transparent",
  });

  const handleSignOut = useCallback(async (e) => {
    e?.preventDefault?.();
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
    } finally {
      try { localStorage.removeItem("user"); } catch {}
      setSigningOut(false);
      try {
        navigate("/login", { replace: true });
      } catch {
        window.location.assign("/login");
      }
    }
  }, [signingOut, navigate]);

  return (
    <div className="dashboard">
        <header className="header">
            <svg width="50" height="50" viewBox="0 0 95 95" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="47.5" cy="47.5" r="47.5" fill="#FCF1FD"/>
                <ellipse cx="47.5001" cy="47.5001" rx="40.3302" ry="40.3302" fill="#006599"/>
                <path d="M29.4294 26.7178H24.2904C22.4924 26.7178 21.0794 28.2923 21.3701 30.0666C22.2654 35.5319 23.7914 38.7461 28.8969 41.42C29.2222 41.5904 29.4379 41.9258 29.4539 42.2926C30.0583 56.1046 33.2888 61.3761 42.9607 66.4525C43.2885 66.6246 43.501 66.9649 43.5115 67.3349C43.5823 69.8293 43.8654 71.4397 44.4382 72.6806C45.3156 74.5813 47.8611 74.7761 49.5694 73.5662C51.5209 72.184 52.795 70.739 54.2545 68.4876C54.3939 68.2725 54.6128 68.1159 54.8611 68.0519C64.5992 65.5447 70.45 61.455 72.8903 53.3637C74.4977 48.0339 69.6724 43.3686 64.1055 43.3686H41.9172C41.3649 43.3686 40.9172 42.9209 40.9172 42.3686V42.2763C40.9172 41.9146 41.1147 41.5812 41.4274 41.3993C46.7668 38.2927 48.659 35.3025 49.1615 29.7589C49.3126 28.0923 47.9379 26.7178 46.2644 26.7178H40.53C38.2315 26.9793 37.2237 27.4405 35.9701 28.5101C35.5542 28.865 34.938 28.8467 34.5193 28.495C33.1123 27.3129 31.6784 26.9355 29.4294 26.7178Z" fill="#FCF1FD" stroke="#FCF1FD"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M25.5569 30.4615C26.6596 34.8724 28.1613 36.8073 32.7341 38.4778C33.1452 38.628 33.4228 39.0257 33.4149 39.4633C33.1866 52.119 35.1398 57.6282 44.1438 62.4723C44.4796 60.8671 44.9304 59.8059 45.791 58.415C46.2767 57.6301 47.2625 56.9847 48.0873 57.3992C48.8385 57.7767 48.7146 58.7857 48.3854 59.5592C46.5096 63.9654 46.0515 66.758 47.3707 71.3786C51.4287 67.7607 53.3944 65.0925 54.9056 59.9476C55.3216 58.5315 56.2851 57.3469 57.5467 56.5809C60.0012 55.0907 61.3229 53.5823 62.5585 51.1535C63.021 50.2443 64.0841 49.3118 64.9991 49.7625C65.7894 50.1518 65.7047 51.0765 65.4089 51.9064C64.0181 55.8093 62.0655 57.3193 58.6646 59.4331C58.4575 59.5618 58.3032 59.7615 58.2324 59.995L57.0515 63.8922C65.7372 60.7865 68.6533 57.2161 70.38 48.6733C70.5031 48.0639 70.0375 47.4968 69.4158 47.4938C64.1917 47.4689 43.4296 47.3704 41.1751 47.3704C38.6769 47.3704 36.5124 44.7704 37.3391 39.5153C37.3917 39.181 37.6222 38.904 37.9325 38.769C42.1712 36.924 43.9638 34.7009 45.1765 30.4615C40.9144 29.9088 38.6855 30.3578 36.0946 33.2208C35.6937 33.6638 34.9993 33.6988 34.5639 33.2897C31.4244 30.34 29.288 29.895 25.5569 30.4615Z" fill="#006599" stroke="#006599"/>
                <path d="M57.568 41.3039C52.0282 36.9214 61.4852 35.5244 55.1155 31.4941C59.9688 35.3611 50.1787 36.811 57.568 41.3039Z" fill="#FCF1FD"/>
                <path d="M63.9156 28.9C60.2553 33.0565 68.0729 37.5952 59.6331 41.3036C65.3823 37.0529 59.0076 34.3769 63.9156 28.9C63.9499 28.8611 63.9853 28.8221 64.0216 28.7832C63.9857 28.8223 63.9504 28.8612 63.9156 28.9Z" fill="#FCF1FD"/>
                <path d="M58.0839 38.5933C66.2157 32.5267 54.5989 31.6232 57.5676 25.5566C53.6954 32.0104 62.8598 30.4615 58.0839 38.5933Z" fill="#FCF1FD"/>
                <circle cx="44.8263" cy="47.7262" r="1.93614" fill="#FCF1FD"/>
                <ellipse cx="44.439" cy="47.0811" rx="1.54891" ry="1.54891" fill="#006599"/>
            </svg>
            <h1>blue52</h1>
            <div>
                <svg width="35" height="35" viewBox="0 0 50 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.8667 50.1654C16.0755 51.6786 17.6157 52.9001 19.3712 53.7376C21.1266 54.5751 23.0514 55.0067 25 54.9999C26.9486 55.0067 28.8734 54.5751 30.6288 53.7376C32.3843 52.9001 33.9245 51.6786 35.1333 50.1654C28.4084 51.0665 21.5916 51.0665 14.8667 50.1654ZM43.7499 19.25V21.186C43.7499 23.5097 44.4165 25.7812 45.6721 27.7145L48.7498 32.4527C51.5582 36.7812 49.4137 42.6634 44.5276 44.0302C31.7603 47.6097 18.2397 47.6097 5.47236 44.0302C0.586279 42.6634 -1.55815 36.7812 1.25016 32.4527L4.32792 27.7145C5.58684 25.7652 6.25489 23.4996 6.25291 21.186V19.25C6.25291 8.61849 14.6473 0 25 0C35.3527 0 43.7499 8.61849 43.7499 19.25Z" fill="white"/>
                </svg>
            </div>
            <div className="profile">
                <div className="profile-name">
                    <h3>{user?.name || ""}</h3>
                    <p>{user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : ""}</p>
                </div>
                <svg width="50" height="50" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="40" fill="white"/>
                    <path d="M48.457 38.3125C49.069 38.4948 49.6517 38.7422 50.2051 39.0547C50.7585 39.3672 51.3379 39.8424 51.9434 40.4805C52.5488 41.1185 53.0664 41.8704 53.4961 42.7363C53.9258 43.6022 54.2839 44.722 54.5703 46.0957C54.8568 47.4694 55 49.0091 55 50.7148C55 52.7201 54.349 54.4355 53.0469 55.8613C51.7448 57.2871 50.1758 58 48.3398 58H31.6602C29.8242 58 28.2552 57.2871 26.9531 55.8613C25.651 54.4355 25 52.7201 25 50.7148C25 49.0091 25.1432 47.4694 25.4297 46.0957C25.7161 44.722 26.0742 43.6022 26.5039 42.7363C26.9336 41.8704 27.4512 41.1185 28.0566 40.4805C28.6621 39.8424 29.2415 39.3672 29.7949 39.0547C30.3483 38.7422 30.931 38.4948 31.543 38.3125C30.5143 36.6849 30 34.9141 30 33C30 31.6458 30.2637 30.3535 30.791 29.123C31.3184 27.8926 32.0312 26.8281 32.9297 25.9297C33.8281 25.0312 34.8926 24.3184 36.123 23.791C37.3535 23.2637 38.6458 23 40 23C41.3542 23 42.6465 23.2637 43.877 23.791C45.1074 24.3184 46.1719 25.0312 47.0703 25.9297C47.9688 26.8281 48.6816 27.8926 49.209 29.123C49.7363 30.3535 50 31.6458 50 33C50 34.9141 49.4857 36.6849 48.457 38.3125ZM40 25.5C37.9297 25.5 36.1621 26.2324 34.6973 27.6973C33.2324 29.1621 32.5 30.9297 32.5 33C32.5 35.0703 33.2324 36.8379 34.6973 38.3027C36.1621 39.7676 37.9297 40.5 40 40.5C42.0703 40.5 43.8379 39.7676 45.3027 38.3027C46.7676 36.8379 47.5 35.0703 47.5 33C47.5 30.9297 46.7676 29.1621 45.3027 27.6973C43.8379 26.2324 42.0703 25.5 40 25.5ZM48.3398 55.5C49.4857 55.5 50.4655 55.0345 51.2793 54.1035C52.0931 53.1725 52.5 52.043 52.5 50.7148C52.5 47.6029 51.9889 45.1484 50.9668 43.3516C49.9447 41.5547 48.4766 40.6107 46.5625 40.5195C44.6745 42.1732 42.487 43 40 43C37.513 43 35.3255 42.1732 33.4375 40.5195C31.5234 40.6107 30.0553 41.5547 29.0332 43.3516C28.0111 45.1484 27.5 47.6029 27.5 50.7148C27.5 52.043 27.9069 53.1725 28.7207 54.1035C29.5345 55.0345 30.5143 55.5 31.6602 55.5H48.3398Z" fill="#006599"/>
                </svg>

            </div>
        </header>
      <div className="container">
        <aside className="navbar">
          <nav>
            <NavLink to="/pos" end style={link}><div>POS</div></NavLink>
            <NavLink to="/customers" style={link}>Customers</NavLink>
            {user?.role === 'manager' && (
              <>
                <NavLink to="/inventory" style={link}>Inventory</NavLink>
                <NavLink to="/admin" style={link}>Admin</NavLink>
                <NavLink to="/menu" style={link}>Menu</NavLink>
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
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
