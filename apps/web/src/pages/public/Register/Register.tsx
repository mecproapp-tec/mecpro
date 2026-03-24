import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { registerTenant } from "../../../services/api";

const MP_CHECKOUT_URL = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${import.meta.env.VITE_MP_PLAN_ID}`;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ officeName: "", email: "", password: "" });
  const [tipoDocumento, setTipoDocumento] = useState("CPF");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [preapprovalId, setPreapprovalId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment");
    const preapproval = params.get("preapproval_id");

    if (paymentStatus === "success" && preapproval) {
      setMessage({ text: "Pagamento autorizado! Agora finalize seu cadastro.", type: "success" });
      setPaymentStarted(true);
      setPreapprovalId(preapproval);

      // Recupera dados salvos no localStorage
      const saved = localStorage.getItem("pendingRegistration");
      if (saved) {
        const data = JSON.parse(saved);
        setForm({
          officeName: data.officeName,
          email: data.email,
          password: data.password,
        });
        setTipoDocumento(data.documentType);
        setNumeroDocumento(data.documentNumber);
        setCep(data.cep);
        setEndereco(data.address);
        setNumero(data.number || "");
        setComplemento(data.complement || "");
        setTelefone(data.phone);
        setOwnerName(data.ownerName);
      }
    } else if (paymentStatus === "failure") {
      setMessage({ text: "Pagamento recusado. Tente novamente.", type: "error" });
      localStorage.removeItem("pendingRegistration");
    } else if (paymentStatus === "pending") {
      setMessage({ text: "Pagamento pendente. Aguarde confirmação.", type: "error" });
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTipoDocumentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipoDocumento(e.target.value);
    setNumeroDocumento("");
  };

  const handleNumeroDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    const maxLength = tipoDocumento === "CPF" ? 11 : 14;
    if (value.length > maxLength) value = value.slice(0, maxLength);
    setNumeroDocumento(value);
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#333";
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setEndereco(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
      } else {
        setMessage({ text: "CEP não encontrado.", type: "error" });
      }
    } catch {
      setMessage({ text: "Erro ao buscar CEP.", type: "error" });
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    setTelefone(value);
  };

  const handlePayment = () => {
    if (!form.email) {
      setMessage({ text: "Preencha o e-mail antes de prosseguir.", type: "error" });
      return;
    }

    // Salva dados do formulário no localStorage
    const formData = {
      officeName: form.officeName,
      documentType: tipoDocumento,
      documentNumber: numeroDocumento,
      cep: cep,
      address: endereco,
      number: numero,
      complement: complemento,
      email: form.email,
      phone: telefone,
      ownerName: ownerName,
      password: form.password,
    };
    localStorage.setItem("pendingRegistration", JSON.stringify(formData));

    // Redireciona diretamente para o Mercado Pago
    window.location.href = MP_CHECKOUT_URL;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStarted || !preapprovalId) {
      setMessage({ text: "Você precisa concluir o pagamento antes de cadastrar.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const enderecoCompleto = `${endereco}, ${numero}${complemento ? `, ${complemento}` : ""}`;

    const payload = {
      officeName: form.officeName,
      documentType: tipoDocumento,
      documentNumber: numeroDocumento,
      cep: cep,
      address: enderecoCompleto,
      email: form.email,
      phone: telefone,
      ownerName: ownerName,
      password: form.password,
      paymentCompleted: true,
      preapprovalId, // enviamos o ID da assinatura
    };

    try {
      const response = await registerTenant(payload);
      setMessage({ text: "Cadastro realizado com sucesso!", type: "success" });

      login({
        id: String(response.user.id),
        email: response.user.email,
        officeName: response.user.officeName,
        token: response.accessToken,
      });

      localStorage.removeItem("pendingRegistration");

      setTimeout(() => navigate("/home"), 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Erro no cadastro. Tente novamente.";
      setMessage({ text: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Estilos inline (mantidos iguais)
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#00e5ff";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#333";
  };
  const inputStyle = {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
    transition: "border 0.2s",
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
          padding: "40px",
          width: "100%",
          maxWidth: "550px",
          boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "42px",
            fontWeight: "800",
            background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "32px",
            letterSpacing: "-0.02em",
          }}
        >
          Cadastro da Oficina
        </h1>

        {message && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "24px",
              backgroundColor: message.type === "error" ? "#ff444420" : "#00ff9d20",
              border: `1px solid ${message.type === "error" ? "#ff4444" : "#00ff9d"}`,
              color: message.type === "error" ? "#ff8888" : "#aaffdd",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Nome da Oficina */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              Nome da Oficina
            </label>
            <input
              name="officeName"
              placeholder="Ex.: Auto Mecânica Silva"
              value={form.officeName}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          {/* Tipo de Documento */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              Tipo de Documento
            </label>
            <select
              value={tipoDocumento}
              onChange={handleTipoDocumentoChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
              required
              disabled={loading}
            >
              <option value="CPF">CPF – Pessoa Física</option>
              <option value="MEI">MEI – Microempreendedor Individual</option>
              <option value="ME">ME – Microempresa</option>
              <option value="EPP">EPP – Empresa de Pequeno Porte</option>
              <option value="LTDA">LTDA – Sociedade Limitada</option>
              <option value="SLU">SLU – Sociedade Limitada Unipessoal</option>
              <option value="SA">SA – Sociedade Anônima</option>
            </select>
          </div>

          {/* Número do Documento */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              {`Nº do documento (${tipoDocumento === "CPF" ? "11 dígitos" : "14 dígitos"})`}
            </label>
            <input
              placeholder="Apenas números"
              value={numeroDocumento}
              onChange={handleNumeroDocumentoChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          {/* CEP */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              CEP (somente números)
            </label>
            <input
              placeholder="Ex.: 12345678"
              value={cep}
              onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
              onFocus={handleFocus}
              onBlur={handleCepBlur}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          {/* Endereço (via CEP) */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              Endereço
            </label>
            <input
              placeholder="Logradouro, bairro, cidade - UF"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          {/* Número e Complemento */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
                Número
              </label>
              <input
                placeholder="Ex.: 123"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={inputStyle}
                required
                disabled={loading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
                Complemento
              </label>
              <input
                placeholder="Opcional"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={inputStyle}
                disabled={loading}
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              E-mail
            </label>
            <input
              name="email"
              type="email"
              placeholder="contato@oficina.com"
              value={form.email}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          {/* Telefone */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              Telefone
            </label>
            <input
              placeholder="21000000000"
              value={telefone}
              onChange={handleTelefoneChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          {/* Nome do Proprietário */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              Nome do Responsavel
            </label>
            <input
              placeholder="Seu Usuário"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          {/* Senha */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#a0a0a0", fontWeight: "600" }}>
              Senha
            </label>
            <input
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          {/* Botão de pagamento */}
          {!paymentStarted && (
            <button
              type="button"
              onClick={handlePayment}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "100px",
                background: "linear-gradient(135deg, #ff00aa, #aa00ff)",
                color: "#fff",
                fontWeight: "700",
                fontSize: "18px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                marginTop: "8px",
                boxShadow: "0 8px 20px rgba(255, 0, 170, 0.3)",
              }}
              disabled={loading}
            >
              1º mês grátis / R$ 149,90
            </button>
          )}

          {/* Botão de cadastro */}
          <button
            type="submit"
            disabled={loading || !paymentStarted}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, #00e5ff, #0077ff)",
              color: "#000",
              fontWeight: "700",
              fontSize: "18px",
              border: "none",
              transition: "all 0.2s",
              marginTop: "8px",
              opacity: loading || !paymentStarted ? 0.6 : 1,
              cursor: loading || !paymentStarted ? "not-allowed" : "pointer",
              boxShadow: loading || !paymentStarted ? "none" : "0 8px 20px rgba(0, 229, 255, 0.3)",
            }}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
      </div>
    </div>
  );
}