import { NavLink, useLocation } from "react-router-dom";
import { HomeIcon, StackIcon, StarIcon, TrophyIcon, UserIcon, UsersIcon } from "./Icons";

function GroupTabs({ groupId }: { groupId: string }) {
  const tabs = [
    { to: `/groups/${groupId}`, label: "Dashboard", icon: HomeIcon, end: true },
    { to: `/groups/${groupId}/backlog`, label: "Backlog", icon: StackIcon, end: false },
    { to: `/groups/${groupId}/zerados`, label: "Zerados", icon: TrophyIcon, end: false },
    { to: `/groups/${groupId}/reviews`, label: "Reviews", icon: StarIcon, end: false },
    { to: `/groups/${groupId}/membros`, label: "Membros", icon: UsersIcon, end: false },
  ];
  return (
    <>
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
    </>
  );
}

function GlobalTabs() {
  const tabs = [
    { to: "/", label: "Home", icon: HomeIcon, end: true },
    { to: "/conexao", label: "Conexão", icon: UsersIcon, end: false },
    { to: "/profile", label: "Perfil", icon: UserIcon, end: false },
  ];
  return (
    <>
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
    </>
  );
}

export function BottomTabBar() {
  const location = useLocation();
  const match = location.pathname.match(/^\/groups\/([^/]+)/);

  return (
    <nav className="tab-bar" aria-label="Navegação principal">
      {match ? <GroupTabs groupId={match[1]} /> : <GlobalTabs />}
    </nav>
  );
}