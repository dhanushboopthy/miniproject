import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/useAuth.js";

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  const handleLogout = () => {
    clear();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-dot" />
            Anganwadi Health
          </div>
          <nav className="nav-links">
            <Link className="nav-link" to="/">
              Dashboard
            </Link>
            <Link className="nav-link" to="/children">
              Children
            </Link>
            <Link className="nav-link" to="/growth/new">
              Measurements
            </Link>
            <Link className="nav-link" to="/nutrition/log">
              Nutrition
            </Link>
            <Link className="nav-link" to="/alerts">
              Alerts
            </Link>
            <Link className="nav-link" to="/reports">
              Reports
            </Link>
          </nav>
          <div className="topbar-user">
            <span className="user-pill">
              {user?.name || "User"} · {user?.role || "worker"}
            </span>
            <button type="button" className="button-ghost" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}
