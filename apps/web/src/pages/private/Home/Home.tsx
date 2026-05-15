// src/pages/private/Home/Home.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiBell, FiUsers, FiFileText, FiDollarSign } from "react-icons/fi";
import MenuHamburguer from "../../../components/MenuHamburguer";
import { getNotifications } from "../../../services/notifications";

export default function Home() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  const iconColor = "#00e5ff";
  const iconSize = 96;
  const headerIconSize = 40;

  const atualizarNotificacoes = async () => {
    try {
      const lista = await getNotifications();
      // ✅ Garante que lista é array antes de usar filter
      const total = Array.isArray(lista) ? lista.filter((n) => !n.read).length : 0;
      setNaoLidas(total);
    } catch (error) {
      console.error("Erro ao carregar notificações", error);
      setNaoLidas(0);
    }
  };

  useEffect(() => {
    atualizarNotificacoes();
    const interval = setInterval(atualizarNotificacoes, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
        minHeight: "100vh",
        padding: "48px 24px",
        color: "#e0e0e0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "64px",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          {/* Menu hambúrguer */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              background: "#1a1a1a",
              border: "none",
              color: iconColor,
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "24px",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0, 229, 255, 0.2)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
          >
            <FiMenu size={headerIconSize} />
          </button>

          {/* Título MecPro */}
          <h1
            style={{
              fontSize: "clamp(40px, 8vw, 80px)",
              fontWeight: "800",
              background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              letterSpacing: "-0.02em",
              textShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
            }}
          >
            MecPro
          </h1>

          {/* Sino de notificações */}
          <button
            onClick={() => navigate("/notificacoes")}
            style={{
              background: "#1a1a1a",
              border: "none",
              color: iconColor,
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "24px",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0, 229, 255, 0.2)",
              position: "relative",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
          >
            <FiBell size={headerIconSize} />
            {naoLidas > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#ff4444",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(255, 68, 68, 0.4)",
                }}
              >
                {naoLidas}
              </span>
            )}
          </button>
        </header>

        {/* Menu Hamburguer */}
        {menuOpen && <MenuHamburguer onClose={() => setMenuOpen(false)} />}

        {/* Ícones principais */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "clamp(40px, 10vw, 120px)",
            flexWrap: "wrap",
            marginTop: "80px",
          }}
        >
          {[
            { icon: FiUsers, label: "Clientes", route: "/clientes" },
            { icon: FiFileText, label: "Orçamentos", route: "/orcamentos" },
            { icon: FiDollarSign, label: "Faturas", route: "/faturas" },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.route)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.3s ease",
                animation: "pulse 2s infinite",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div
                style={{
                  background: "#1a1a1a",
                  borderRadius: "32px",
                  padding: "24px",
                  boxShadow: "0 20px 40px rgba(0, 229, 255, 0.2), 0 0 0 1px #00e5ff20",
                  marginBottom: "16px",
                }}
              >
                <item.icon color={iconColor} size={iconSize} />
              </div>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "600",
                  background: "linear-gradient(135deg, #fff, #e0e0e0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.9; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}