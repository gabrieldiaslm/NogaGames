import { NavLink } from "react-router-dom";
import { HomeIcon, StackIcon, TrophyIcon, UserIcon } from "./Icons";

const tabs = [
  { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
  { to: "/backlog", label: "Backlog", icon: StackIcon, end: false },
  { to: "/completed", label: "Zerados", icon: TrophyIcon, end: false },
  { to: "/profile", label: "Perfil", icon: UserIcon, end: false },
];

export function BottomTabBar() {
  return (
    <nav className="tab-bar" aria-label="Navegação principal">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `tab-item${isActive ? " active" : ""}`}
        >
          <Icon />
          <span className="tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}