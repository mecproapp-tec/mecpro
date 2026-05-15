// apps/web/src/pages/private/Configuracoes/Configuracoes.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import { getTenant, type TenantData } from "../../../services/tenant";
import toast from "react-hot-toast";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oficina, setOficina] = useState<TenantData | null>(null);
  const [loadingOficina, setLoadingOficina] = useState(true);

  useEffect(() => {
    carregarOficina();
  }, []);

  const carregarOficina = async () => {
    try {
      const data = await getTenant();
      setOficina(data);
    } catch (err) {
      console.error("Erro ao carregar dados da oficina", err);
    } finally {
      setLoadingOficina(false);
    }
  };

  const handleDarBaixa = () => {
    setMostrarConfirmacao(true);
    setError(null);
  };

  const confirmarDarBaixa = async () => {
    setProcessando(true);
    setError(null);

    try {
      const response = await api.post("/payments/cancel-subscription");

      if (response.data.success) {
        toast.success("Plano cancelado com sucesso. Você será redirecionado.");
        // Limpa todos os dados locais e faz logout
        localStorage.clear();
        sessionStorage.clear();
        await logout();
        navigate("/login", { state: { message: "Sua assinatura foi cancelada com sucesso." } });
      } else {
        setError(response.data.message || "Erro ao cancelar assinatura. Tente novamente.");
        setMostrarConfirmacao(false);
      }
    } catch (err: any) {
      console.error("Erro ao cancelar assinatura:", err);
      setError(err.response?.data?.message || "Erro ao cancelar assinatura. Tente novamente.");
      setMostrarConfirmacao(false);
    } finally {
      setProcessando(false);
    }
  };

  const iconColor = "#00e5ff";
  const bgCard = "#1a1a1a";

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
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Botão Voltar estilizado – padrão profissional */}
        <div style={{ marginBottom: "40px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "#1a1a1a",
              border: "none",
              color: "#00e5ff",
              width: "48px",
              height: "48px",
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
            <FiArrowLeft />
          </button>
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: "700",
            marginBottom: "32px",
            color: "#fff",
            textShadow: "0 0 10px rgba(0, 229, 255, 0.5)",
          }}
        >
          Configurações
        </h1>

        {error && (
          <div
            style={{
              background: "#ff444420",
              border: "1px solid #ff4444",
              color: "#ff8888",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: bgCard,
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 10px 30px rgba(0, 229, 255, 0.1)",
            border: "1px solid rgba(0, 229, 255, 0.2)",
            marginBottom: "48px",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#fff",
              }}
            >
              Informações da Conta
            </h2>
            {loadingOficina ? (
              <p style={{ color: "#888" }}>Carregando...</p>
            ) : (
              <>
                <p style={{ color: "#ccc", marginBottom: "8px" }}>
                  <span style={{ color: iconColor }}>Empresa / Oficina:</span> {oficina?.nome || "—"}
                </p>
                <p style={{ color: "#ccc", marginBottom: "8px" }}>
                  <span style={{ color: iconColor }}>E-mail da oficina:</span> {oficina?.email || "—"}
                </p>
                <p style={{ color: "#ccc" }}>
                  <span style={{ color: iconColor }}>Plano:</span> Premium
                </p>
              </>
            )}
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#fff",
              }}
            >
              Preferências
            </h2>
            <p style={{ color: "#888" }}>Em breve: tema, suporte técnico, etc.</p>
          </div>

          <div style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#ff6b6b",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiAlertTriangle color="#ff6b6b" /> Zona de Perigo
            </h2>
            <p style={{ color: "#aaa", marginBottom: "20px", lineHeight: "1.6" }}>
              Ao cancelar seu plano, você perderá acesso ao sistema e todos os seus dados serão removidos.
              Esta ação é irreversível. Deseja continuar?
            </p>
            <button
              onClick={handleDarBaixa}
              disabled={processando}
              style={{
                background: "#ff4444",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "14px 24px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: processando ? "not-allowed" : "pointer",
                opacity: processando ? 0.6 : 1,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!processando) e.currentTarget.style.background = "#cc0000";
              }}
              onMouseLeave={(e) => {
                if (!processando) e.currentTarget.style.background = "#ff4444";
              }}
            >
              {processando ? "Processando..." : "Cancelar Plano"}
            </button>
          </div>
        </div>
      </div>

      {mostrarConfirmacao && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
          onClick={() => !processando && setMostrarConfirmacao(false)}
        >
          <div
            style={{
              background: bgCard,
              borderRadius: "16px",
              border: "1px solid rgba(255, 68, 68, 0.3)",
              maxWidth: "400px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#ff6b6b",
                marginBottom: "12px",
              }}
            >
              Confirmar cancelamento
            </h3>
            <p style={{ color: "#ccc", marginBottom: "24px", lineHeight: "1.6" }}>
              Tem certeza que deseja cancelar seu plano? Esta ação não poderá ser desfeita e todos os seus dados serão perdidos.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setMostrarConfirmacao(false)}
                disabled={processando}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid #444",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: processando ? "not-allowed" : "pointer",
                  opacity: processando ? 0.5 : 1,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!processando) e.currentTarget.style.background = "#333";
                }}
                onMouseLeave={(e) => {
                  if (!processando) e.currentTarget.style.background = "transparent";
                }}
              >
                Voltar
              </button>
              <button
                onClick={confirmarDarBaixa}
                disabled={processando}
                style={{
                  flex: 1,
                  background: "#ff4444",
                  border: "none",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: processando ? "not-allowed" : "pointer",
                  opacity: processando ? 0.5 : 1,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!processando) e.currentTarget.style.background = "#cc0000";
                }}
                onMouseLeave={(e) => {
                  if (!processando) e.currentTarget.style.background = "#ff4444";
                }}
              >
                {processando ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}