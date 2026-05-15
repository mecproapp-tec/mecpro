import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiFileText, FiCreditCard, FiSettings } from "react-icons/fi";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/home", label: "Home", icon: FiHome },
    { path: "/clientes", label: "Clientes", icon: FiUsers },
    { path: "/orcamentos", label: "Orçamentos", icon: FiFileText },
    { path: "/faturas", label: "Faturas", icon: FiCreditCard },
    { path: "/configuracoes", label: "Configurações", icon: FiSettings },
  ];

  return (
    <div className="w-64 bg-black border-r border-blue-500 text-white h-screen p-6">
      <h1 className="text-2xl text-blue-400 font-bold mb-10">MecPro</h1>
      <nav className="flex flex-col gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-500/20 text-blue-400 border-l-4 border-blue-500"
                  : "hover:bg-gray-800 hover:text-blue-400"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}