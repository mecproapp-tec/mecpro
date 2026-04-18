// DetalhesCliente.tsx – VERSÃO PROFISSIONAL COMPLETA
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiEye,
  FiEyeOff,
  FiTrash2,
} from "react-icons/fi";

import {
  getClientById,
  type Client,
  getVehicleDisplay,
} from "../../../services/clients";
import {
  getEstimates,
  type Estimate,
} from "../../../services/Estimates";
import {
  getInvoices,
  type Invoice,
} from "../../../services/invoices";
import {
  getAppointments,
  deleteAppointment,
  type Appointment,
} from "../../../services/appointments";

// ================= DESIGN SYSTEM =================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    padding: "40px 24px",
    color: "#e0e0e0",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px",
  },
  backButton: {
    background: "#111",
    border: "1px solid #00e5ff20",
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#00e5ff",
  },
  title: {
    fontSize: "36px",
    fontWeight: 700,
    background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
  },
  card: {
    background: "#0f0f0f",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "32px",
    border: "1px solid #00e5ff20",
  },
  clientName: {
    fontSize: "28px",
    fontWeight: 600,
    marginBottom: "20px",
    color: "#fff",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  label: {
    color: "#777",
    fontSize: "12px",
    marginBottom: "4px",
    display: "block",
  },
  value: {
    fontSize: "15px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  observations: {
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #00e5ff20",
  },
  textarea: {
    width: "100%",
    background: "#111",
    border: "1px solid #00e5ff20",
    borderRadius: "10px",
    padding: "12px",
    color: "#fff",
    marginTop: "8px",
    fontSize: "14px",
    resize: "vertical",
  },
  saveButton: {
    marginTop: "12px",
    background: "#00e5ff",
    border: "none",
    color: "#000",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: 600,
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  tableWrapper: {
    background: "#0f0f0f",
    borderRadius: "16px",
    overflow: "auto",
    border: "1px solid #00e5ff20",
    marginBottom: "32px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px",
  },
  th: {
    textAlign: "left",
    padding: "14px",
    fontSize: "13px",
    backgroundColor: "#111",
    color: "#00e5ff",
    borderBottom: "1px solid #00e5ff20",
  },
  td: {
    padding: "14px",
    fontSize: "14px",
    borderBottom: "1px solid #00e5ff10",
  },
  actionButton: {
    background: "#111",
    border: "1px solid #00e5ff20",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#00e5ff",
  },
  emptyMessage: {
    padding: "32px",
    textAlign: "center",
    color: "#777",
  },
  totalCell: {
    textAlign: "right",
    fontWeight: 600,
    color: "#00e5ff",
  },
  eyeButton: {
    background: "transparent",
    border: "none",
    color: "#00e5ff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: 600,
  },
};

// ================= UTILITÁRIOS =================

function maskDocumentNumber(number: string): string {
  if (!number) return "";
  const digits = number.replace(/\D/g, "");
  return "•".repeat(digits.length);
}

function getStatusLabel(status: string, type: "estimate" | "invoice"): string {
  if (type === "estimate") {
    switch (status) {
      case "DRAFT": return "Pendente";
      case "APPROVED": return "Aceito";
      case "CONVERTED": return "Convertido";
      default: return status;
    }
  } else {
    switch (status) {
      case "PENDING": return "Pendente";
      case "PAID": return "Paga";
      case "CANCELED": return "Cancelada";
      default: return status;
    }
  }
}

function getStatusColor(status: string, type: "estimate" | "invoice"): string {
  if (type === "estimate") {
    switch (status) {
      case "DRAFT": return "#ffaa00";
      case "APPROVED": return "#00ff88";
      case "CONVERTED": return "#6c757d";
      default: return "#fff";
    }
  } else {
    switch (status) {
      case "PENDING": return "#ffaa00";
      case "PAID": return "#00ff88";
      case "CANCELED": return "#ff4444";
      default: return "#fff";
    }
  }
}

function calculateTotalWithIss(items?: Invoice["items"]): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const quantity = item.quantity || 1;
    const subtotal = price * quantity;
    const issPercent = Number(item.issPercent) || 0;
    const issValue = subtotal * (issPercent / 100);
    return acc + subtotal + issValue;
  }, 0);
}

// ================= COMPONENTE PRINCIPAL =================

export default function DetalhesCliente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<Client | null>(null);
  const [orcamentos, setOrcamentos] = useState<Estimate[]>([]);
  const [faturas, setFaturas] = useState<Invoice[]>([]);
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDoc, setShowDoc] = useState(false);

  useEffect(() => {
    if (!id) return;
    const clientId = Number(id);
    Promise.all([
      getClientById(clientId),
      getEstimates(1, 100).then(res => {
        let data = Array.isArray(res) ? res : res.data || [];
        return data.filter((e: any) => e.clientId === clientId);
      }),
      getInvoices().then(res => {
        let data = Array.isArray(res) ? res : res.data || [];
        return data.filter((i: any) => i.clientId === clientId);
      }),
      getAppointments().then(res => {
        let data = Array.isArray(res) ? res : res.data || [];
        return data.filter((a: any) => a.clientId === clientId);
      }),
    ])
      .then(([cli, est, inv, apps]) => {
        setCliente(cli);
        setOrcamentos(est);
        setFaturas(inv);
        setAgendamentos(apps);
        const saved = localStorage.getItem(`cliente_obs_${clientId}`);
        setObservacoes(saved || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveObservacoes = () => {
    if (!cliente) return;
    localStorage.setItem(`cliente_obs_${cliente.id}`, observacoes);
    alert("Observações salvas!");
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!confirm("Excluir este agendamento?")) return;
    try {
      await deleteAppointment(appointmentId);
      setAgendamentos(prev => prev.filter(a => a.id !== appointmentId));
    } catch (err) {
      alert("Erro ao excluir");
    }
  };

  const handlePDF = (item: Estimate | Invoice, type: "estimate" | "invoice") => {
    const oficina = JSON.parse(localStorage.getItem("oficina") || "{}");
    const win = window.open("", "_blank");
    if (!win) return;

    const totalComIss = type === "invoice" && "items" in item
      ? calculateTotalWithIss(item.items)
      : Number(item.total);

    win.document.write(`
      <html>
        <head><title>${type === "estimate" ? "Orçamento" : "Fatura"} ${item.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #00e5ff; padding-bottom: 20px; }
          .logo { max-width: 100px; max-height: 80px; object-fit: contain; }
          .info { flex: 1; }
          .info h2 { margin: 0 0 5px; color: #333; }
          .info p { margin: 3px 0; color: #666; }
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
          <h1>${type === "estimate" ? "Orçamento" : "Fatura"}</h1>
          <p><strong>Cliente:</strong> ${cliente?.name}</p>
          <p><strong>Data:</strong> ${new Date(item.date || (item as any).createdAt).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${getStatusLabel(item.status, type)}</p>
          <div class="details"><h3>Itens</h3>
          <table><thead><tr><th>Descrição</th><th>Qtd</th><th>Preço</th><th>ISS</th><th>Total</th></tr></thead>
          <tbody>${(item.items || []).map((i: any) => {
            const price = Number(i.price);
            const qty = i.quantity || 1;
            const subtotal = price * qty;
            const iss = (Number(i.issPercent) || 0) * subtotal / 100;
            const totalItem = subtotal + iss;
            return `<tr><td>${i.description}</td><td class="valor">${qty}</td><td class="valor">${price.toFixed(2)}</td><td class="valor">${i.issPercent ? i.issPercent + '%' : '-'}</td><td class="valor">${totalItem.toFixed(2)}</td></tr>`;
          }).join("")}</tbody>
          <tfoot><tr class="total-row"><td colspan="4" class="valor"><strong>Total</strong></td><td class="valor"><strong>${totalComIss.toFixed(2)}</strong></td></tr></tfoot>
          </table></div>
          <div class="total-geral"><strong>Total: R$ ${totalComIss.toFixed(2)}</strong></div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) return <div style={styles.container}>Carregando dados...</div>;
  if (!cliente) return <div style={styles.container}>Cliente não encontrado</div>;

  const renderDoc = () => {
    if (!cliente.document) return "Não informado";
    const masked = maskDocumentNumber(cliente.document);
    return (
      <>
        {showDoc ? cliente.document : masked}
        <button onClick={() => setShowDoc(!showDoc)} style={styles.eyeButton}>
          {showDoc ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* HEADER */}
        <div style={styles.header}>
          <button onClick={() => navigate("/clientes")} style={styles.backButton}>
            <FiArrowLeft size={20} />
          </button>
          <h1 style={styles.title}>Detalhes do Cliente</h1>
        </div>

        {/* CARD DO CLIENTE */}
        <div style={styles.card}>
          <h2 style={styles.clientName}>{cliente.name}</h2>
          <div style={styles.infoGrid}>
            <div><span style={styles.label}>Telefone</span><span style={styles.value}>{cliente.phone || "-"}</span></div>
            <div><span style={styles.label}>Veículo</span><span style={styles.value}>{getVehicleDisplay(cliente)}</span></div>
            <div><span style={styles.label}>Placa</span><span style={styles.value}>{cliente.plate || "-"}</span></div>
            <div><span style={styles.label}>Documento</span><span style={styles.value}>{renderDoc()}</span></div>
            <div><span style={styles.label}>Endereço</span><span style={styles.value}>{cliente.address || "-"}</span></div>
          </div>
          <div style={styles.observations}>
            <span style={styles.label}>Observações</span>
            <textarea
              style={styles.textarea}
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações sobre o cliente..."
            />
            <button onClick={handleSaveObservacoes} style={styles.saveButton}>Salvar Observações</button>
          </div>
        </div>

        {/* SEÇÃO: ORÇAMENTOS */}
        <div>
          <h3 style={styles.sectionTitle}><FiFileText /> Orçamentos ({orcamentos.length})</h3>
          {orcamentos.length === 0 ? (
            <div style={styles.emptyMessage}>Nenhum orçamento encontrado.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead><tr>{["Data", "Total", "Status", "Ações"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {orcamentos.map(orc => (
                    <tr key={orc.id}>
                      <td style={styles.td}>{new Date(orc.date).toLocaleDateString()}</td>
                      <td style={{ ...styles.td, ...styles.totalCell }}>R$ {Number(orc.total).toFixed(2)}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: getStatusColor(orc.status, "estimate") + "20", color: getStatusColor(orc.status, "estimate") }}>
                          {getStatusLabel(orc.status, "estimate")}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handlePDF(orc, "estimate")} style={styles.actionButton} title="Visualizar PDF">
                          <FiFileText size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SEÇÃO: FATURAS */}
        <div>
          <h3 style={styles.sectionTitle}><FiDollarSign /> Faturas ({faturas.length})</h3>
          {faturas.length === 0 ? (
            <div style={styles.emptyMessage}>Nenhuma fatura encontrada.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead><tr>{["Número", "Data", "Total", "Status", "Ações"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {faturas.map(fat => {
                    const totalComIss = calculateTotalWithIss(fat.items);
                    return (
                      <tr key={fat.id}>
                        <td style={styles.td}>{fat.number}</td>
                        <td style={styles.td}>{new Date(fat.createdAt).toLocaleDateString()}</td>
                        <td style={{ ...styles.td, ...styles.totalCell }}>R$ {totalComIss.toFixed(2)}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, backgroundColor: getStatusColor(fat.status, "invoice") + "20", color: getStatusColor(fat.status, "invoice") }}>
                            {getStatusLabel(fat.status, "invoice")}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => handlePDF(fat, "invoice")} style={styles.actionButton} title="Visualizar PDF">
                            <FiFileText size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SEÇÃO: AGENDAMENTOS */}
        <div>
          <h3 style={styles.sectionTitle}><FiClock /> Agendamentos ({agendamentos.length})</h3>
          {agendamentos.length === 0 ? (
            <div style={styles.emptyMessage}>Nenhum agendamento encontrado.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead><tr>{["Data/Hora", "Comentário", "Ações"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {agendamentos.map(ag => (
                    <tr key={ag.id}>
                      <td style={styles.td}>{new Date(ag.date).toLocaleString()}</td>
                      <td style={styles.td}>{ag.comment || "-"}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleDeleteAppointment(ag.id)} style={{ ...styles.actionButton, color: "#ff5555", borderColor: "#ff555530" }} title="Excluir">
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}