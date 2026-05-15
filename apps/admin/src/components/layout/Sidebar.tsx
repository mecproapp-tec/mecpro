import { NavLink } from "react-router-dom";
import { FiHome, FiUsers, FiBell, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();
  const iconColor = "#00e5ff";
  const activeClass = "bg-neonBlue/20 border-l-4 border-neonBlue";

  return (
    <aside className="w-64 bg-gray900 min-h-screen p-4 border-r border-gray800 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-neonBlue">MecPro Admin</h1>
        <p className="text-xs text-gray-500 mt-1">Painel de controle</p>
      </div>

      <nav className="space-y-2 flex-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? activeClass : "hover:bg-gray800"
            }`
          }
        >
          <FiHome color={iconColor} size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/users"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? activeClass : "hover:bg-gray800"
            }`
          }
        >
          <FiUsers color={iconColor} size={20} />
          <span>Usuários</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? activeClass : "hover:bg-gray800"
            }`
          }
        >
          <FiBell color={iconColor} size={20} />
          <span>Notificações</span>
        </NavLink>
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors mt-auto"
      >
        <FiLogOut size={20} />
        <span>Sair</span>
      </button>
    </aside>
  );
}
