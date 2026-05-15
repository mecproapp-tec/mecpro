// apps/web/src/pages/private/FAQ/FAQ.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSend, FiHelpCircle } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";

export default function FAQ() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "true") {
      setSucesso(true);
      const timeout = setTimeout(() => {
        setSucesso(false);
        navigate(location.pathname, { replace: true });
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [location, navigate]);

  const iconColor = "#00e5ff";
  const bgCard = "#111";
  const bgInput = "#1a1a1a";
  const borderColor = "#00e5ff30";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim() || carregando) return;

    setCarregando(true);
    setErro("");

    try {
      await api.post("/contact", {
        userEmail: user?.email,
        userName: user?.officeName || user?.name,
        message: mensagem,
      });
      window.location.href = "/faq?success=true";
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      setErro(error.response?.data?.message || "Erro ao enviar. Tente novamente.");
      setCarregando(false);
    }
  };

  // Lista de perguntas frequentes
  const faqItems = [
    {
      pergunta: "Como faço para cancelar meu plano?",
      resposta:
        "Você pode cancelar seu plano acessando 'Configurações' e clicando em 'Cancelar Plano'. O cancelamento será processado e você não perderá acesso ao sistema.",
    },
    {
      pergunta: "Como atualizar os dados da oficina?",
      resposta:
        "Acesse o menu e clique em 'Dados da Oficina'. Lá você pode editar nome, endereço, telefone, e‑mail e outras informações da sua oficina.",
    },
    {
      pergunta: "Como funcionam as notificações?",
      resposta:
        "As notificações alertam sobre agendamentos, vencimentos e outras atualizações importantes. Você pode visualizá‑las no ícone do sino ou no menu 'Notificações'.",
    },
    {
      pergunta: "Como entro em contato com o suporte?",
      resposta:
        "Utilize o formulário abaixo para enviar sua mensagem diretamente à administração. Responderemos em até 24 horas úteis.",
    },
  ];

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
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* 🔙 Botão Voltar – padrão profissional */}
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

        {/* Título principal */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <FiHelpCircle size={48} color={iconColor} />
          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 48px)",
              fontWeight: "700",
              margin: 0,
              color: "#fff",
              textShadow: "0 0 10px rgba(0, 229, 255, 0.5)",
            }}
          >
            Ajuda & FAQ
          </h1>
        </div>

        {/* Seção de perguntas frequentes */}
        <div
          style={{
            background: bgCard,
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
            marginBottom: "48px",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "600",
              marginBottom: "24px",
              color: "#fff",
              borderBottom: "2px solid #00e5ff30",
              paddingBottom: "12px",
            }}
          >
            Perguntas Frequentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqItems.map((item, index) => (
              <details
                key={index}
                style={{
                  background: "#1a1a1a",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  border: "1px solid #00e5ff20",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#00e5ff";
                  e.currentTarget.style.boxShadow = "0 0 8px rgba(0, 229, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#00e5ff20";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <summary
                  style={{
                    fontWeight: "600",
                    color: "#00e5ff",
                    fontSize: "18px",
                    outline: "none",
                    transition: "color 0.2s",
                  }}
                >
                  {item.pergunta}
                </summary>
                <p
                  style={{
                    marginTop: "12px",
                    color: "#b0b0b0",
                    fontSize: "15px",
                    lineHeight: "1.6",
                    paddingLeft: "8px",
                    borderLeft: "3px solid #00e5ff40",
                  }}
                >
                  {item.resposta}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Formulário de contato */}
        <div
          style={{
            background: bgCard,
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#fff",
            }}
          >
            Fale com o Administrador
          </h2>
          <p style={{ color: "#a0a0a0", marginBottom: "24px", fontSize: "16px", lineHeight: "1.5" }}>
            Tem alguma dúvida, sugestão ou problema? Envie uma mensagem. Responderemos em breve.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="mensagem"
                style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontSize: "14px", fontWeight: "500" }}
              >
                Sua mensagem
              </label>
              <textarea
                id="mensagem"
                rows={6}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem aqui... (mínimo 10 caracteres)"
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  background: bgInput,
                  border: "1px solid #00e5ff30",
                  borderRadius: "16px",
                  color: "#fff",
                  fontSize: "16px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  transition: "border 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#00e5ff";
                  e.currentTarget.style.boxShadow = "0 0 8px rgba(0, 229, 255, 0.3)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#00e5ff30";
                  e.currentTarget.style.boxShadow = "none";
                }}
                required
                minLength={10}
              />
            </div>

            {erro && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "12px 16px",
                  background: "#ff444420",
                  border: "1px solid #ff4444",
                  color: "#ff8888",
                  borderRadius: "12px",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                {erro}
              </div>
            )}

            {sucesso && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "12px 16px",
                  background: "#00ff4420",
                  border: "1px solid #00ff44",
                  color: "#00ff88",
                  borderRadius: "12px",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                ✅ Mensagem enviada com sucesso! Em breve você será contatado pela administração.
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !mensagem.trim()}
              style={{
                background: "#00e5ff",
                color: "#000",
                border: "none",
                borderRadius: "100px",
                padding: "14px 28px",
                fontSize: "16px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                cursor: carregando || !mensagem.trim() ? "not-allowed" : "pointer",
                opacity: carregando || !mensagem.trim() ? 0.6 : 1,
                transition: "all 0.2s",
                boxShadow: "0 8px 20px rgba(0, 229, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!carregando && mensagem.trim())
                  e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {carregando ? (
                "Enviando..."
              ) : (
                <>
                  <FiSend size={20} /> Enviar Mensagem
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}