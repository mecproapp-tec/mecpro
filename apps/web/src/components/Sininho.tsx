import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { getNotifications } from "../services/notifications";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Sininho() {
  const [total, setTotal] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchNotificacoes = async () => {
    try {
      const data = await getNotifications();
      const naoLidas = Array.isArray(data) ? data.filter((n) => !n.read).length : 0;
      setTotal(naoLidas);
    } catch (error: any) {
      console.error("Erro ao carregar notificações", error);
      if (error.response?.status === 401) {
        console.warn("Sessão expirada, redirecionando para login...");
        logout();
        navigate("/login");
        return;
      }
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchNotificacoes();

    // 🔥 Escuta o evento disparado pela página de notificações
    const handleUpdate = () => fetchNotificacoes();
    window.addEventListener("notificationCountUpdated", handleUpdate);

    const interval = setInterval(fetchNotificacoes, 30000); // fallback

    return () => {
      window.removeEventListener("notificationCountUpdated", handleUpdate);
      clearInterval(interval);
    };
  }, [logout, navigate]);

  const handleClick = () => {
    navigate("/notificacoes");
  };

  return (
    <div style={{ position: "relative", cursor: "pointer" }} onClick={handleClick}>
      <FiBell size={26} color="#00e5ff" />
      {total > 0 && (
        <div
          style={{
            position: "absolute",
            top: "-6px",
            right: "-8px",
            background: "red",
            color: "#fff",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {total > 99 ? "99+" : total}
        </div>
      )}
    </div>
  );
}