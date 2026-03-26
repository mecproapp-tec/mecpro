import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiPlus, FiArrowLeft, FiFileText, FiMessageCircle, FiEye } from "react-icons/fi";
import { getInvoices, deleteInvoice, updateInvoice, calculateTotalWithIss } from "../../../services/invoices";
import type { Invoice } from "../../../services/invoices";
import { getVehicleDisplay } from "../../../services/clients";
import api from "../../../services/api";

type FilterType = "todos" | "PENDING" | "PAID" | "CANCELED";

export default function Faturas() {
  const navigate = useNavigate();
  const [faturas, setFaturas] = useState<Invoice[]>([]);
  const [filtro, setFiltro] = useState<FilterType>("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const botaoStyle = {
    background: "#1a1a1a",
    border: "1px solid",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const invoicesData = await getInvoices();
      setFaturas(invoicesData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar faturas");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id: number) => {
    const confirmar = confirm("Tem certeza que deseja excluir esta fatura?");
    if (!confirmar) return;

    try {
      await deleteInvoice(id);
      setFaturas(faturas.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao excluir fatura");
    }
  };

  const handleStatusChange = async (fatura: Invoice, novoStatus: string) => {
    try {
      await updateInvoice(fatura.id, {
        clientId: fatura.clientId,
        items: fatura.items,
        status: novoStatus as any,
      });
      setFaturas(prev => prev.map(f => f.id === fatura.id ? { ...f, status: novoStatus as any } : f));
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao atualizar status");
    }
  };

  const handleWhatsApp = async (fatura: Invoice) => {
    const cliente = fatura.client;
    if (!cliente) {
      alert("Cliente não encontrado");
      return;
    }

    let telefone = cliente.phone.replace(/\D/g, "");
    if (telefone.length === 10 || telefone.length === 11) {
      telefone = "55" + telefone;
    }

    try {
      const response = await api.post(`/invoices/${fatura.id}/share`);
      const { url: link } = response.data;

      const vehicleDisplay = getVehicleDisplay(cliente);

      const mensagem = encodeURIComponent(
        `${link}

Olá ${cliente.name}!

Sua fatura ${fatura.number} está disponível ✅

👤 Cliente: ${cliente.name}
🚗 Veículo: ${vehicleDisplay}
💰 Total: R$ ${fatura.total.toFixed(2)}
📌 Status: ${
          fatura.status === "PAID"
            ? "Paga"
            : fatura.status === "PENDING"
            ? "Pendente"
            : "Cancelada"
        }`
      );

      window.open(`https://wa.me/${telefone}?text=${mensagem}`, "_blank");
    } catch (error) {
      console.error("Erro ao gerar link da fatura:", error);
      alert("Erro ao gerar link da fatura. Tente novamente.");
    }
  };

  const handlePDF = (fatura: Invoice) => {
    const oficina = JSON.parse(localStorage.getItem("oficina") || "{}");
    const totalComIss = calculateTotalWithIss(fatura.items);
    const cliente = fatura.client;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Fatura ${fatura.number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #00e5ff; padding-bottom: 20px; }
              .logo { max-width: 100px; max-height: 80px; object-fit: contain; }
              .info { flex: 1; }
              .info h2 { margin: 0 0 5px; color: #333; }
              .info p { margin: 3px 0; color: #666; }
              .details { margin-top: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f2f2f2; }
              .valor { text-align: right; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
              .total-geral { font-size: 1.2rem; font-weight: bold; margin-top: 20px; text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              ${oficina.logo ? `<img src="${oficina.logo}" class="logo" />` : ""}
              <div class="info">
                <h2>${oficina.nome || "Oficina"}</h2>
                <p>${oficina.tipoDocumento || ""} ${oficina.documento || ""}</p>
                <p>${oficina.endereco || ""}, ${oficina.numero || ""}</p>
                <p>Tel: ${oficina.telefone || ""} | Email: ${oficina.email || ""}</p>
              </div>
            </div>
            <h1>Fatura</h1>
            <p><strong>Número:</strong> ${fatura.number}</p>
            <p><strong>Cliente:</strong> ${cliente?.name || "Cliente não encontrado"}</p>
            <p><strong>Veículo:</strong> ${cliente ? getVehicleDisplay(cliente) : "Não informado"}</p>
            <p><strong>Placa:</strong> ${cliente?.plate || ""}</p>
            <p><strong>Data:</strong> ${new Date(fatura.createdAt).toLocaleDateString("pt-BR")}</p>
            <p><strong>Status:</strong> ${
              fatura.status === "PAID"
                ? "Paga"
                : fatura.status === "PENDING"
                ? "Pendente"
                : "Cancelada"
            }</p>
            <div class="details">
              <h3>Itens</h3>
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th class="valor">Qtd</th>
                    <th class="valor">Preço Unit.</th>
                    <th class="valor">ISS (%)</th>
                    <th class="valor">Total c/ ISS</th>
                  </tr>
                </thead>
                <tbody>
                  ${fatura.items.map(item => {
                    const iss = item.issPercent ? item.price * (item.issPercent / 100) : 0;
                    const totalItem = (item.price + iss) * item.quantity;
                    return `
                      <tr>
                        <td>${item.description}</td>
                        <td class="valor">${item.quantity}</td>
                        <td class="valor">${item.price.toFixed(2)}</td>
                        <td class="valor">${item.issPercent ? item.issPercent + '%' : '-'}</td>
                        <td class="valor">${totalItem.toFixed(2)}</td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;"><strong>Total Geral</strong></td>
                    <td class="valor"><strong>${totalComIss.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="total-geral">
              <strong>Total: R$ ${totalComIss.toFixed(2)}</strong>
            </div>
          </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  };

  const faturasFiltradas = faturas.filter((f) => {
    if (filtro === "todos") return true;
    return f.status === filtro;
  });

  const totalGeral = faturasFiltradas.reduce((acc, f) => acc + f.total, 0);

  if (loading) return <div style={styles.loadingContainer}><div style={styles.loading}>Carregando faturas...</div></div>;
  if (error) return <div style={styles.errorContainer}><div style={styles.error}>{error}</div></div>;

  return (
    <div style={{ background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)", minHeight: "100vh", padding: "48px 24px", color: "#e0e0e0", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "#1a1a1a", border: "none", color: "#00e5ff", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "24px", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0, 229, 255, 0.2)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")} onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}>
              <FiArrowLeft />
            </button>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "700", background: "linear-gradient(135deg, #00e5ff, #7fdbff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>Faturas</h1>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ background: "#1a1a1a", padding: "12px 24px", borderRadius: "100px", fontWeight: "600", fontSize: "1.1rem", color: "#00e5ff", border: "1px solid #00e5ff30", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)" }}>
              Total: <span style={{ color: "#ffffff", marginLeft: "8px" }}>R$ {totalGeral.toFixed(2)}</span>
            </div>
            <button onClick={() => navigate("/faturas/nova")} style={{ background: "linear-gradient(135deg, #00e5ff, #0077ff)", color: "#000", padding: "12px 24px", borderRadius: "100px", fontWeight: "600", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s", boxShadow: "0 8px 20px rgba(0, 229, 255, 0.3)" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
              <FiPlus size={20} /> Nova Fatura
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
          {[
            { key: "todos", label: "Todos" },
            { key: "PENDING", label: "Pendente" },
            { key: "PAID", label: "Paga" },
            { key: "CANCELED", label: "Cancelada" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFiltro(f.key as FilterType)} style={{ padding: "10px 24px", borderRadius: "100px", background: filtro === f.key ? "#00e5ff" : "transparent", color: filtro === f.key ? "#000" : "#00e5ff", border: filtro === f.key ? "none" : "1px solid #00e5ff40", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem", transition: "all 0.2s" }} onMouseEnter={(e) => { if (filtro !== f.key) e.currentTarget.style.background = "#00e5ff10"; }} onMouseLeave={(e) => { if (filtro !== f.key) e.currentTarget.style.background = "transparent"; }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div style={{ background: "#111", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ background: "#1e1e1e", borderBottom: "2px solid #00e5ff30" }}>
                  <th style={{ padding: "20px 16px", textAlign: "left", fontWeight: "600", color: "#a0a0a0" }}>Nº</th>
                  <th style={{ padding: "20px 16px", textAlign: "left", fontWeight: "600", color: "#a0a0a0" }}>Cliente</th>
                  <th style={{ padding: "20px 16px", textAlign: "left", fontWeight: "600", color: "#a0a0a0" }}>Veículo</th>
                  <th style={{ padding: "20px 16px", textAlign: "left", fontWeight: "600", color: "#a0a0a0" }}>Placa</th>
                  <th style={{ padding: "20px 16px", textAlign: "left", fontWeight: "600", color: "#a0a0a0" }}>Data</th>
                  <th style={{ padding: "20px 16px", textAlign: "right", fontWeight: "600", color: "#a0a0a0" }}>Total</th>
                  <th style={{ padding: "20px 16px", textAlign: "left", fontWeight: "600", color: "#a0a0a0" }}>Status</th>
                  <th style={{ padding: "20px 16px", textAlign: "center", fontWeight: "600", color: "#a0a0a0" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {faturasFiltradas.map((f, index) => {
                  const cliente = f.client;
                  return (
                    <tr key={f.id} style={{ borderBottom: "1px solid #2a2a2a", transition: "background 0.2s", background: index % 2 === 0 ? "#0f0f0f" : "#1a1a1a" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")} onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "#0f0f0f" : "#1a1a1a")}>
                      <td style={{ padding: "18px 16px", fontWeight: "500", color: "#fff" }}>{f.number}</td>
                      <td style={{ padding: "18px 16px", color: "#b0b0b0" }}>{cliente?.name || "Cliente não encontrado"}</td>
                      <td style={{ padding: "18px 16px", color: "#b0b0b0" }}>{cliente ? getVehicleDisplay(cliente) : "Não informado"}</td>
                      <td style={{ padding: "18px 16px", color: "#b0b0b0" }}>{cliente?.plate || ""}</td>
                      <td style={{ padding: "18px 16px", color: "#b0b0b0" }}>{new Date(f.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: "18px 16px", textAlign: "right", fontWeight: "600", color: "#00e5ff" }}>R$ {f.total.toFixed(2)}</td>
                      <td style={{ padding: "18px 16px" }}>
                        <select value={f.status} onChange={(e) => handleStatusChange(f, e.target.value)} style={{ background: "#1a1a1a", color: "#00e5ff", border: "1px solid #00e5ff40", padding: "8px 12px", borderRadius: "100px", cursor: "pointer", fontWeight: "500", fontSize: "0.85rem", outline: "none" }}>
                          <option value="PENDING">Pendente</option>
                          <option value="PAID">Paga</option>
                          <option value="CANCELED">Cancelada</option>
                        </select>
                      </td>
                      <td style={{ padding: "18px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                          <button onClick={() => navigate(`/clientes/ver/${f.clientId}`)} style={{ ...botaoStyle, color: "#00e5ff", borderColor: "#00e5ff30" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#00e5ff20"; e.currentTarget.style.borderColor = "#00e5ff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#00e5ff30"; }} title="Ver cliente"><FiEye size={16} /></button>
                          <button onClick={() => handleExcluir(f.id)} style={{ ...botaoStyle, color: "#ff5555", borderColor: "#ff555530" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#ff555520"; e.currentTarget.style.borderColor = "#ff5555"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#ff555530"; }} title="Excluir"><FiTrash2 size={16} /></button>
                          <button onClick={() => handlePDF(f)} style={{ ...botaoStyle, color: "#00e5ff", borderColor: "#00e5ff30" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#00e5ff20"; e.currentTarget.style.borderColor = "#00e5ff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#00e5ff30"; }} title="Gerar PDF"><FiFileText size={16} /></button>
                          <button onClick={() => handleWhatsApp(f)} style={{ ...botaoStyle, color: "#25D366", borderColor: "#25D36630" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#25D36620"; e.currentTarget.style.borderColor = "#25D366"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#25D36630"; }} title="Enviar WhatsApp"><FiMessageCircle size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {faturasFiltradas.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "60px 16px", textAlign: "center", color: "#888", fontStyle: "italic" }}>Nenhuma fatura encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: { background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" },
  loading: { color: "#00e5ff", fontSize: "18px" },
  errorContainer: { background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" },
  error: { color: "#ff4444", fontSize: "18px" },
};