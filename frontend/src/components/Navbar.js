import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

function readCartCount() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]")
      .reduce((s, it) => s + (it.qty || 1), 0);
  } catch { return 0; }
}

function readUser() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);

    const token = localStorage.getItem("token");
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    const data = JSON.parse(atob(payload));
    return data?.username ? { id: data.id, username: data.username, role: data.role } : null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(() => readUser());
  const [cartCount, setCartCount] = useState(() => readCartCount());
  const navigate = useNavigate();

  useEffect(() => {
    const refreshAuth = () => {
      const newUser = readUser();
      setUser(newUser);
    };
    
    const refreshCart = () => setCartCount(readCartCount());

    const onStorage = () => { 
      refreshAuth(); 
      refreshCart(); 
    };

    window.addEventListener("auth:changed", refreshAuth);
    window.addEventListener("cart:updated", refreshCart);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("auth:changed", refreshAuth);
      window.removeEventListener("cart:updated", refreshCart);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? "bg-white/10 text-indigo-200" : "text-slate-200 hover:text-white"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("auth:changed"));
    setMobileOpen(false);
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-slate-900/80 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-white shrink-0">
            <span className="text-2xl leading-none">📚</span>
            <span className="text-xl font-semibold tracking-wide">BookLoft</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={linkClass}>Acasă</NavLink>

            <NavLink to="/cart" className={linkClass}>
              <span className="relative">
                Coș
                {cartCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-indigo-500 text-white text-[10px] px-1.5 py-0.5">
                    {cartCount}
                  </span>
                )}
              </span>
            </NavLink>

            {!user ? (
              <>
                <NavLink to="/login" className={linkClass}>Autentificare</NavLink>
                <NavLink to="/signup" className={linkClass}>Înregistrare</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/profile" className={linkClass}>Profil ({user.username})</NavLink>
                
                {user.role === "admin" && (
                  <NavLink to="/admin" className={linkClass}>
                    ⚙️ Admin
                  </NavLink>
                )}

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-600/20 transition"
                >
                  Delogare
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/10"
            aria-label="Deschide meniul"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✖" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/90">
          <div className="px-4 py-3 space-y-2">
            <NavLink to="/" className={linkClass} onClick={() => setMobileOpen(false)}>
              Acasă
            </NavLink>
            <NavLink to="/cart" className={linkClass} onClick={() => setMobileOpen(false)}>
              Coș {cartCount > 0 && (
                <span className="ml-2 rounded-full bg-indigo-500 text-white text-[10px] px-1.5 py-0.5">
                  {cartCount}
                </span>
              )}
            </NavLink>

            {!user ? (
              <>
                <NavLink to="/login" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Autentificare
                </NavLink>
                <NavLink to="/signup" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Înregistrare
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/profile" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Profil ({user.username})
                </NavLink>
                
                {user.role === "admin" && (
                  <NavLink to="/admin" className={linkClass} onClick={() => setMobileOpen(false)}>
                    ⚙️ Admin
                  </NavLink>
                )}

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-left text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-600/20 transition w-full"
                >
                  Delogare
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}