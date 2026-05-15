// apps/web/src/components/layout/Layout.tsx
import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sininho from "../Sininho"; // ajuste o caminho se necessário

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      {/* Menu lateral */}
      <aside style={{ width: "250px", background: "#111", padding: "24px", borderRight: "1px solid #333" }}>
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ color: "#00e5ff", margin: 0 }}>MecPro</h2>
          <p style={{ color: "#a0a0a0", fontSize: "14px", marginTop: "8px" }}>
            {user?.officeName || user?.email}
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Link to="/home" style={linkStyle}>Início</Link>
          <Link to="/clientes" style={linkStyle}>Clientes</Link>
          <Link to="/orcamentos" style={linkStyle}>Orçamentos</Link>
          <Link to="/faturas" style={linkStyle}>Faturas</Link>
          <Link to="/agendamento/novo" style={linkStyle}>Agenda</Link>
          <Link to="/configuracoes" style={linkStyle}>Configurações</Link>
          <button
            onClick={handleLogout}
            style={{
              ...linkStyle,
              background: "transparent",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              color: "#ff4444",
              marginTop: "16px",
            }}
          >
            Sair
          </button>
        </nav>
      </aside>

      {/* Área principal com cabeçalho e conteúdo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: "60px",
            background: "#111",
            borderBottom: "1px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 20px",
          }}
        >
          <Sininho />
        </header>
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

const linkStyle = {
  color: "#a0a0a0",
  textDecoration: "none",
  fontSize: "16px",
  padding: "10px 12px",
  borderRadius: "8px",
  transition: "all 0.2s",
};