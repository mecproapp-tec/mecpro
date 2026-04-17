// apps/web/src/pages/private/Configuracoes/Oficina.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUpload, FiTrash2, FiSave } from "react-icons/fi";
import { getTenant, updateTenant } from "../../../services/tenant";
import type { UpdateTenantData } from "../../../services/tenant";

const DOCUMENT_CONFIG = {
  CPF: { max: 11, hint: "000.000.000-00" },
  MEI: { max: 14, hint: "00.000.000/0000-00" },
  ME: { max: 14, hint: "00.000.000/0000-00" },
  EPP: { max: 14, hint: "00.000.000/0000-00" },
  LTDA: { max: 14, hint: "00.000.000/0000-00" },
  SLU: { max: 14, hint: "00.000.000/0000-00" },
  SA: { max: 14, hint: "00.000.000/0000-00" },
};

type TipoDocumento = keyof typeof DOCUMENT_CONFIG;

interface OficinaData {
  nome: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  numero: string;
  endereco: string;
  telefone: string;
  email: string;
  logo?: string;
}

const isValidTipo = (tipo: string): tipo is TipoDocumento => {
  return tipo in DOCUMENT_CONFIG;
};

export default function OficinaConfig() {
  const navigate = useNavigate();
  const [oficina, setOficina] = useState<OficinaData>({
    nome: "",
    tipoDocumento: "CPF",
    documento: "",
    numero: "",
    endereco: "",
    telefone: "",
    email: "",
    logo: "",
  });
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTenant();
        // Garante que tipoDocumento seja uma chave válida
        let tipoValido: TipoDocumento = "CPF";
        if (data.tipoDocumento && isValidTipo(data.tipoDocumento)) {
          tipoValido = data.tipoDocumento;
        }
        setOficina({
          nome: data.nome || "",
          tipoDocumento: tipoValido,
          documento: data.documento || "",
          numero: data.numero || "",
          endereco: data.endereco || "",
          telefone: data.telefone || "",
          email: data.email || "",
          logo: data.logo || "",
        });
        setLogoPreview(data.logo || "");
      } catch (error) {
        console.error("Erro ao carregar dados da oficina:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDocumento = (value: string, tipo: TipoDocumento): string => {
    const digits = value.replace(/\D/g, "");
    const max = DOCUMENT_CONFIG[tipo].max;
    const limited = digits.slice(0, max);
    if (tipo === "CPF") {
      return limited
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2")
        .slice(0, 14);
    } else {
      return limited
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "tipoDocumento") {
      const novoTipo = value as TipoDocumento;
      const novoDocumento = formatDocumento(oficina.documento, novoTipo);
      setOficina((prev) => ({
        ...prev,
        tipoDocumento: novoTipo,
        documento: novoDocumento.replace(/\D/g, ""),
      }));
    } else if (name === "documento") {
      const rawValue = value.replace(/\D/g, "");
      const max = DOCUMENT_CONFIG[oficina.tipoDocumento].max;
      const limited = rawValue.slice(0, max);
      setOficina((prev) => ({ ...prev, documento: limited }));
    } else {
      setOficina((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setOficina((prev) => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setOficina((prev) => ({ ...prev, logo: "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpdateTenantData = {
        nome: oficina.nome,
        tipoDocumento: oficina.tipoDocumento,
        documento: oficina.documento,
        numero: oficina.numero,
        endereco: oficina.endereco,
        telefone: oficina.telefone,
        email: oficina.email,
        logo: oficina.logo,
      };
      await updateTenant(payload);
      alert("Dados da oficina salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar dados. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const config = DOCUMENT_CONFIG[oficina.tipoDocumento];
  const documentoDisplay = formatDocumento(oficina.documento, oficina.tipoDocumento);

  if (loading) {
    return (
      <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#00e5ff" }}>
        Carregando...
      </div>
    );
  }

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
        <div style={{ display: "flex", alignItems: "center", marginBottom: "40px" }}>
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
              marginRight: "16px",
            }}
          >
            <FiArrowLeft />
          </button>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: "700",
              background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Dados da Oficina
          </h1>
        </div>

        <div
          style={{
            background: "#111",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Nome */}
            <div>
              <label style={{ color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Nome da Oficina</label>
              <input
                type="text"
                name="nome"
                value={oficina.nome}
                onChange={handleChange}
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1px solid #00e5ff30",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>

            {/* Tipo e Documento */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
              <div>
                <label style={{ color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Tipo</label>
                <select
                  name="tipoDocumento"
                  value={oficina.tipoDocumento}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    background: "#1a1a1a",
                    border: "1px solid #00e5ff30",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#fff",
                    fontSize: "1rem",
                  }}
                >
                  {Object.keys(DOCUMENT_CONFIG).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Documento (número)</label>
                <input
                  type="text"
                  name="documento"
                  value={documentoDisplay}
                  onChange={handleChange}
                  maxLength={config.max + 5}
                  placeholder={config.hint}
                  style={{
                    width: "100%",
                    background: "#1a1a1a",
                    border: "1px solid #00e5ff30",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#fff",
                    fontSize: "1rem",
                  }}
                />
                <small style={{ color: "#a0a0a0", display: "block", marginTop: "4px" }}>Máx. {config.max} dígitos</small>
              </div>
            </div>

            {/* Número (endereço) */}
            <div>
              <label style={{ color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Número (endereço)</label>
              <input
                type="text"
                name="numero"
                value={oficina.numero}
                onChange={handleChange}
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1px solid #00e5ff30",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>

            {/* Endereço */}
            <div>
              <label style={{ color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Endereço (rua, bairro, cidade)</label>
              <input
                type="text"
                name="endereco"
                value={oficina.endereco}
                onChange={handleChange}
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1px solid #00e5ff30",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>

            {/* Telefone */}
            <div>
              <label style={{ color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Telefone</label>
              <input
                type="text"
                name="telefone"
                value={oficina.telefone}
                onChange={handleChange}
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1px solid #00e5ff30",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Email</label>
              <input
                type="email"
                name="email"
                value={oficina.email}
                onChange={handleChange}
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1px solid #00e5ff30",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>

            {/* Logo */}
            <div>
              <label style={{ color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Logo da Oficina</label>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <label
                  htmlFor="logo-upload"
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #00e5ff30",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    color: "#00e5ff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                  }}
                >
                  <FiUpload /> Selecionar imagem
                </label>
                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                {logoPreview && (
                  <button
                    onClick={handleRemoveLogo}
                    style={{
                      background: "#ff555520",
                      border: "1px solid #ff5555",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      color: "#ff5555",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FiTrash2 /> Remover logo
                  </button>
                )}
              </div>
              {logoPreview && (
                <div style={{ marginTop: "16px" }}>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "100px",
                      borderRadius: "8px",
                      border: "1px solid #00e5ff30",
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: "linear-gradient(135deg, #00e5ff, #0077ff)",
                color: "#000",
                padding: "14px 24px",
                borderRadius: "100px",
                fontWeight: "600",
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: "0 8px 20px rgba(0, 229, 255, 0.3)",
                marginTop: "16px",
                opacity: saving ? 0.7 : 1,
              }}
            >
              <FiSave size={20} /> {saving ? "Salvando..." : "Salvar Dados"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}