import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/home");
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        "Erro ao fazer login. Verifique suas credenciais.";
      setError(message);
      console.error("Erro no login:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#00e5ff";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#333";
  };

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#111",
          borderRadius: "32px",
          padding: "48px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: "48px",
              fontWeight: "800",
              background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "16px",
            }}
          >
            MecPro
          </h1>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                backgroundColor: "#ff444420",
                border: "1px solid #ff4444",
                color: "#ff8888",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#a0a0a0",
                fontWeight: "600",
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid #333",
                background: "#1a1a1a",
                color: "#fff",
                fontSize: "16px",
                outline: "none",
                transition: "border 0.2s",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#a0a0a0",
                fontWeight: "600",
              }}
            >
              Senha
            </label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid #333",
                background: "#1a1a1a",
                color: "#fff",
                fontSize: "16px",
                outline: "none",
                transition: "border 0.2s",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={() => setRemember(!remember)}
              disabled={loading}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "#00e5ff",
              }}
            />
            <label htmlFor="remember" style={{ color: "#a0a0a0", cursor: "pointer" }}>
              Lembrar
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, #00e5ff, #0077ff)",
              color: "#000",
              fontWeight: "700",
              fontSize: "18px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              marginTop: "8px",
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? "none" : "0 8px 20px rgba(0, 229, 255, 0.3)",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p style={{ textAlign: "center", color: "#a0a0a0", marginTop: "16px" }}>
            Não tem conta?{" "}
            <Link
              to="/register"
              style={{
                color: "#00e5ff",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Cadastrar Oficina
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}