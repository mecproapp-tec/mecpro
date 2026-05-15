import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getNotifications } from "../services/notifications";
import { FiSettings, FiHelpCircle, FiLogOut, FiImage, FiBell, FiX } from "react-icons/fi";

interface Props {
  onClose: () => void;
}

export default function MenuHamburguer({ onClose }: Props) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const iconColor = "#00e5ff";
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isMounted = true;

    const carregarNotificacoes = async () => {
      try {
        const lista = await getNotifications();
        if (isMounted) {
          const total = Array.isArray(lista) ? lista.filter((n) => !n.read).length : 0;
          setNaoLidas(total);
        }
      } catch (error: any) {
        console.error("Erro ao carregar notificações", error);
        
        // 🔥 BUG #43 CORRIGIDO: Verificar se é erro de autenticação
        if (error.response?.status === 401) {
          console.warn("Sessão expirada, redirecionando para login...");
          if (isMounted) {
            logout();
            navigate("/login");
          }
          return;
        }
        
        if (isMounted) {
          setNaoLidas(0);
        }
      }
    };
    
    carregarNotificacoes();
    interval = setInterval(carregarNotificacoes, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { icon: FiBell, label: "Notifications", route: "/notificacoes" },
    { icon: FiSettings, label: "Configurações", route: "/configuracoes" },
    { icon: FiHelpCircle, label: "FAQ", route: "/faq" },
    { icon: FiImage, label: "Dados da Oficina", route: "/oficina/config" },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-80 bg-[#0a0a0a]/90 backdrop-blur-xl border-r border-[#00e5ff]/20 shadow-2xl z-50 transform transition-transform duration-500 ease-out animate-slide-in">
        <div className="relative h-28 bg-gradient-to-br from-[#00e5ff]/15 via-transparent to-transparent flex items-center justify-between px-6">
          <div>
            <h2 className="text-3xl font-light text-[#00e5ff] tracking-wider drop-shadow-[0_0_10px_#00e5ff]">Menu</h2>
            <p className="text-xs text-[#00e5ff]/50 mt-1">navegação rápida</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#00e5ff]/20 transition-all duration-300 group">
            <FiX size={28} className="text-[#00e5ff] group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
        <ul className="py-8 px-4 flex flex-col gap-4">
          {menuItems.map((item) => (
            <li
              key={item.route}
              onClick={() => {
                onClose();
                navigate(item.route);
              }}
              className="group relative flex items-center justify-between px-4 py-4 rounded-xl cursor-pointer overflow-hidden transition-all duration-300 hover:bg-[#00e5ff]/10 hover:pl-6"
            >
              <div className="flex items-center gap-4">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#00e5ff] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                <item.icon size={22} color={iconColor} className="transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_#00e5ff]" />
                <span className="text-gray-300 group-hover:text-white font-medium tracking-wide text-lg">{item.label}</span>
              </div>
              {item.label === "Notifications" && naoLidas > 0 && (
                <div className="bg-[#00e5ff] text-black text-xs font-bold px-2 py-1 rounded-full">
                  {naoLidas > 99 ? "99+" : naoLidas}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00e5ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full" />
            </li>
          ))}
          <div className="my-4 h-px bg-gradient-to-r from-transparent via-[#00e5ff]/40 to-transparent" />
          <li
            onClick={handleLogout}
            className="group relative flex items-center gap-4 px-4 py-4 rounded-xl cursor-pointer overflow-hidden transition-all duration-300 hover:bg-[#00e5ff]/10 hover:pl-6"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#00e5ff] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
            <FiLogOut size={22} color={iconColor} className="transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_#00e5ff]" />
            <span className="text-gray-300 group-hover:text-white font-medium tracking-wide text-lg">Sair</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00e5ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full" />
          </li>
        </ul>
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-[#00e5ff]/30 tracking-wider">MecPro • v2.0 • futuro</p>
        </div>
      </div>
    </>
  );
}