import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../services/api";

interface CheckoutProps {
  email?: string;
  officeName?: string;
  onSuccess?: (preapprovalId: string) => void;
  onFailure?: (error: string) => void;
}

export default function Checkout({ email, officeName, onSuccess, onFailure }: CheckoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUniqueId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handlePayment = async () => {
    const targetEmail = email || (() => {
      const saved = localStorage.getItem("pendingRegistration");
      if (saved) {
        try {
          const data = JSON.parse(saved);
          return data.email;
        } catch {
          return null;
        }
      }
      return null;
    })();

    if (!targetEmail) {
      const errorMsg = "E-mail não informado";
      setError(errorMsg);
      onFailure?.(errorMsg);
      return;
    }

    const uniqueId = generateUniqueId();
    
    const pendingData = {
      email: targetEmail,
      officeName: officeName || "",
      externalReference: uniqueId,
      timestamp: Date.now()
    };
    
    localStorage.setItem("pendingCheckout", JSON.stringify(pendingData));

    setLoading(true);
    setError(null);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

    try {
      const response = await fetch(`${API_URL}/payments/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: targetEmail,
          externalReference: uniqueId,
        }),
      });

      const data = await response.json();

      if (data.checkoutLink) {
        if (onSuccess) {
          onSuccess(data.preapprovalId || uniqueId);
        }
        window.location.href = data.checkoutLink;
      } else {
        throw new Error(data.message || "Erro ao criar checkout");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Erro ao iniciar pagamento";
      setError(errorMsg);
      onFailure?.(errorMsg);
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment");
    const preapprovalId = params.get("preapproval_id");
    const paymentId = params.get("payment_id");

    if (paymentStatus === "success" && preapprovalId) {
      localStorage.setItem("checkoutPreapprovalId", preapprovalId);
      if (onSuccess) {
        onSuccess(preapprovalId);
      }
      navigate("/register?payment=success&preapproval_id=" + preapprovalId);
    } else if (paymentStatus === "failure") {
      setError("Pagamento recusado. Tente novamente.");
      onFailure?.("Pagamento recusado");
      localStorage.removeItem("pendingCheckout");
      navigate("/register?payment=failure");
    } else if (paymentStatus === "pending") {
      setError("Pagamento pendente. Aguarde confirmação.");
      navigate("/register?payment=pending");
    }
  }, [location, navigate, onSuccess, onFailure]);

  return (
    <div style={{
      background: "linear-gradient(135deg, #0a0a0a 0%, #000000 100%)",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px"
    }}>
      <div style={{
        background: "#111",
        borderRadius: "32px",
        padding: "48px",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 30px 60px rgba(0,0,0,0.8), 0 0 0 1px #00e5ff20"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, #00e5ff, #0077ff)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "40px"
        }}>
          💳
        </div>

        <h2 style={{
          fontSize: "28px",
          fontWeight: "700",
          background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "16px"
        }}>
          Plano Único
        </h2>

        <div style={{
          fontSize: "48px",
          fontWeight: "800",
          color: "#fff",
          marginBottom: "8px"
        }}>
          R$ 149,90
        </div>

        <p style={{ color: "#888", marginBottom: "32px" }}>
          Acesso completo à plataforma
        </p>

        <ul style={{
          textAlign: "left",
          color: "#ccc",
          marginBottom: "32px",
          paddingLeft: "20px"
        }}>
          <li style={{ marginBottom: "12px" }}>✅ Gestão de clientes</li>
          <li style={{ marginBottom: "12px" }}>✅ Orçamentos e faturas</li>
          <li style={{ marginBottom: "12px" }}>✅ Agendamentos</li>
          <li style={{ marginBottom: "12px" }}>✅ Suporte prioritário</li>
        </ul>

        {error && (
          <div style={{
            background: "#ff444420",
            border: "1px solid #ff4444",
            color: "#ff8888",
            padding: "12px",
            borderRadius: "12px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "100px",
            background: loading 
              ? "#333" 
              : "linear-gradient(135deg, #ff00aa, #aa00ff)",
            color: "#fff",
            fontWeight: "700",
            fontSize: "18px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            opacity: loading ? 0.6 : 1,
            boxShadow: loading ? "none" : "0 8px 20px rgba(255, 0, 170, 0.3)"
          }}
        >
          {loading ? "Processando..." : "Assinar Agora"}
        </button>

        <p style={{
          fontSize: "12px",
          color: "#666",
          marginTop: "24px"
        }}>
          Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>
  );
}