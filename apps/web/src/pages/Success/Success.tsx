import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheckCircle, FiArrowRight, FiClock } from 'react-icons/fi';

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [preapprovalId, setPreapprovalId] = useState<string | null>(null);

  useEffect(() => {
    // Extrair parâmetros da URL
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const preapproval = params.get('preapproval_id');

    console.log('✅ Pagamento recebido:', { paymentStatus, preapproval });

    if (preapproval) {
      setPreapprovalId(preapproval);
    }

    // Redirecionar automaticamente após 5 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const redirectUrl = preapproval 
            ? `/register?payment=success&preapproval_id=${preapproval}`
            : '/register';
          navigate(redirectUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const handleFinalizar = () => {
    const redirectUrl = preapprovalId 
      ? `/register?payment=success&preapproval_id=${preapprovalId}`
      : '/register';
    navigate(redirectUrl);
  };

  return (
    <div style={{
      background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#111",
        borderRadius: "32px",
        padding: "48px",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px #00ff9d20",
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          background: "#00ff9d20",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <FiCheckCircle size={50} color="#00ff9d" />
        </div>
        
        <h1 style={{
          fontSize: "32px",
          fontWeight: "700",
          background: "linear-gradient(135deg, #00ff9d, #00e5ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "16px",
        }}>
          Pagamento Aprovado!
        </h1>
        
        <p style={{ color: "#a0a0a0", marginBottom: "16px", lineHeight: "1.6" }}>
          Seu pagamento foi processado com sucesso.
        </p>
        
        <p style={{ color: "#666", marginBottom: "32px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <FiClock size={16} />
          Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
        </p>
        
        <button
          onClick={handleFinalizar}
          style={{
            background: "linear-gradient(135deg, #00e5ff, #0077ff)",
            color: "#000",
            border: "none",
            padding: "14px 28px",
            borderRadius: "100px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            boxShadow: "0 4px 15px rgba(0, 229, 255, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 229, 255, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 229, 255, 0.3)";
          }}
        >
          Finalizar Cadastro Agora <FiArrowRight />
        </button>
      </div>
    </div>
  );
}