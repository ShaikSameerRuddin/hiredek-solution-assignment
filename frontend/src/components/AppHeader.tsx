import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface NavItem {
  key: string;
  label: string;
  to: string;
}

interface AppHeaderProps {
  title: string;
  active: string;
}

export function AppHeader({ title, active }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items: NavItem[] =
    user?.role === "optician"
      ? [{ key: "schedule", label: "Schedule", to: "/schedule" }]
      : [
          { key: "home", label: "Home", to: "/" },
          { key: "catalogue", label: "Catalogue", to: "/catalogue" },
          { key: "shared", label: "Shared Components", to: "/shared-components" },
        ];

  return (
    <header className="app-header">
      <h1>{title}</h1>
      <nav>
        {items.map((item) => (
          <Link key={item.key} to={item.to} className={item.key === active ? "active" : undefined}>
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          className="link"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
