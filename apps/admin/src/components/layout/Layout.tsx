import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  FiMenu, FiUsers, FiHome, FiLogOut, FiBell, 
  FiFileText, FiDollarSign, FiUser, FiMail 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-blackBg text-white">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray900 border-r border-gray800 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          <h2 className={`font-bold text-neonBlue ${!sidebarOpen && "hidden"}`}>
            Admin MecPro
          </h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu className="text-gray-400 hover:text-neonBlue" size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray800 text-gray-300 hover:text-neonBlue transition"
          >
            <FiHome size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link
            to="/tenants"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray800 text-gray-300 hover:text-neonBlue transition"
          >
            <FiUsers size={20} />
            {sidebarOpen && <span>Tenants</span>}
          </Link>
          <Link
            to="/clients"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray800 text-gray-300 hover:text-neonBlue transition"
          >
            <FiUser size={20} />
            {sidebarOpen && <span>Clientes</span>}
          </Link>
          <Link
            to="/estimates"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray800 text-gray-300 hover:text-neonBlue transition"
          >
            <FiFileText size={20} />
            {sidebarOpen && <span>Orçamentos</span>}
          </Link>
          <Link
            to="/invoices"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray800 text-gray-300 hover:text-neonBlue transition"
          >
            <FiDollarSign size={20} />
            {sidebarOpen && <span>Faturas</span>}
          </Link>
          <Link
            to="/notifications"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray800 text-gray-300 hover:text-neonBlue transition"
          >
            <FiBell size={20} />
            {sidebarOpen && <span>Notificações</span>}
          </Link>
          <Link
            to="/notifications/bulk"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray800 text-gray-300 hover:text-neonBlue transition"
          >
            <FiBell size={20} />
            {sidebarOpen && <span>Enviar Notificação</span>}
          </Link>
          <Link
            to="/contact-messages"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray800 text-gray-300 hover:text-neonBlue transition"
          >
            <FiMail size={20} />
            {sidebarOpen && <span>Mensagens de Contato</span>}
          </Link>
        </nav>
        <div className="p-4 border-t border-gray800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded hover:bg-gray800 text-gray-300 hover:text-red-500 transition"
          >
            <FiLogOut size={20} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
