import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTrash2,
  FiPlus,
  FiArrowLeft,
  FiFileText,
  FiMessageCircle,
  FiEye,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getInvoices, deleteInvoice, updateInvoice, type Invoice, resendInvoicePdf } from "../../../services/invoices";
import { getClientById, type Client } from "../../../services/clients";
import api from "../../../services/api";

type FilterType = "todos" | "PENDING" | "PAID" | "CANCELED";

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "PENDING": return "Pendente";
    case "PAID":    return "Paga";
    case "CANCELED":return "Cancelada";
    default:        return status;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "PAID":     return "#00ff88";
    case "PENDING":  return "#ffaa00";
    case "CANCELED": return "#ff4444";
    default:         return "#ffffff";
  }
};

const getPaymentMethodLabel = (method?: string): string => {
  switch (method) {
    case 'CREDIT_CARD': return 'Cartão Crédito';
    case 'DEBIT_CARD': return 'Cartão Débito';
    case 'BANK_TRANSFER': return 'Transferência';
    case 'PIX': return 'PIX';
    default: return '—';
  }
};

const calculateTotalWithIss = (items?: Invoice["items"]): number => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const quantity = item.quantity || 1;
    const subtotal = price * quantity;
    const issPercent = Number(item.issPercent) || 0;
    const issValue = subtotal * (issPercent / 100);
    return acc + subtotal + issValue;
  }, 0);
};

export default function Faturas() {
  const navigate = useNavigate();
  const [faturas, setFaturas] = useState<Invoice[]>([]);
  const [filtro, setFiltro] = useState<FilterType>("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await getInvoices(1, 100);
      
      let faturasArray: Invoice[] = [];
      if (response.data && Array.isArray(response.data)) {
        faturasArray = response.data;
      } else if (Array.isArray(response)) {
        faturasArray = response;
      } else {
        faturasArray = [];
      }

      const convertedFaturas = faturasArray.map(f => {
        const items = (f.items || []).map(item => ({
          ...item,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          quantity: item.quantity ?? 1,
          issPercent: item.issPercent ?? 0,
        }));
        return {
          ...f,
          total: typeof f.total === 'string' ? parseFloat(f.total) : (f.total || 0),
          items,
        };
      });

      setFaturas(convertedFaturas);
      await carregarClientesFaltantes(convertedFaturas);
    } catch (err: any) {
      console.error("Erro ao carregar:", err);
      setError(err.response?.data?.message || "Erro ao carregar faturas");
      setFaturas([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarClientesFaltantes = async (faturas: Invoice[]) => {
    const missingClientIds = faturas
      .filter(inv => !inv.client && typeof inv.clientId === 'number' && inv.clientId > 0)
      .map(inv => inv.clientId)
      .filter((id, index, self) => self.indexOf(id) === index);

    if (missingClientIds.length === 0) return;

    try {
      const response = await api.get("/clients", {
        params: { ids: missingClientIds.join(','), limit: 100 }
      });
      
      const clientMap = new Map<number, Client>();
      const clients = response.data?.data || response.data || [];
      
      clients.forEach((client: Client) => {
        clientMap.set(client.id, client);
      });
      
      setFaturas(prev =>
        prev.map(inv => ({
          ...inv,
          client: inv.client || clientMap.get(inv.clientId) || undefined,
        }))
      );
    } catch (err) {
      console.warn("Erro ao carregar clientes em lote:", err);
      const clientMap = new Map<number, Client>();
      await Promise.all(
        missingClientIds.map(async (id) => {
          try {
            const client = await getClientById(id);
            if (client) clientMap.set(id, client);
          } catch (err) {
            console.warn(`Cliente ${id} não encontrado`);
          }
        })
      );
      setFaturas(prev =>
        prev.map(inv => ({
          ...inv,
          client: inv.client || clientMap.get(inv.clientId) || undefined,
        }))
      );
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleExcluir = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta fatura?")) return;
    try {
      await deleteInvoice(id);
      setFaturas(faturas.filter(f => f.id !== id));
      toast.success("Fatura excluída com sucesso!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao excluir fatura");
    }
  };

  const handleStatusChange = async (fatura: Invoice, novoStatus: "PENDING" | "PAID" | "CANCELED") => {
    if (!fatura.clientId || typeof fatura.clientId !== 'number' || fatura.clientId <= 0) {
      toast.error("Esta fatura não possui um cliente válido.");
      return;
    }
    try {
      await updateInvoice(fatura.id, { status: novoStatus });
      setFaturas(prev =>
        prev.map(f => (f.id === fatura.id ? { ...f, status: novoStatus } : f))
      );
      toast.success(`Status alterado para ${getStatusLabel(novoStatus)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao alterar status");
    }
  };

  const handleWhatsApp = async (item: Invoice) => {
    const cliente = item.client;
    let phoneNumber = cliente?.phone;

    if (!phoneNumber) {
      phoneNumber = prompt('Digite o número do WhatsApp do cliente (com DDD, sem 55):');
      if (!phoneNumber) return;
    }

    let telefone = phoneNumber.replace(/\D/g, '');
    if (telefone.startsWith('55')) {
      telefone = telefone.slice(2);
    }

    if (telefone.length !== 10 && telefone.length !== 11) {
      toast.error('Número inválido. Use DDD + número (ex.: 21999999999)');
      return;
    }

    const toastId = toast.loading('Gerando link do WhatsApp...');

    try {
      const response = await api.post(`/invoices/${item.id}/send-whatsapp`, { phoneNumber: telefone });
      const { whatsappUrl } = response.data;

      if (!whatsappUrl) {
        throw new Error('Link do WhatsApp não foi gerado pelo servidor.');
      }

      console.log('📲 WhatsApp URL gerada:', whatsappUrl);
      toast.dismiss(toastId);

      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        toast.warning(
          <div>
            Pop‑up bloqueado. Clique no link abaixo para abrir o WhatsApp:
            <br />
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', wordBreak: 'break-all' }}>
              {whatsappUrl}
            </a>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success('WhatsApp aberto!');
      }
    } catch (error: any) {
      console.error('❌ Erro no WhatsApp:', error);
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || 'Erro ao gerar link. Tente novamente.');
    }
  };

  const handlePDF = async (fatura: Invoice) => {
    const loadingToast = toast.loading('Gerando PDF...');
    try {
      const { pdfUrl } = await resendInvoicePdf(fatura.id);
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
        toast.success('PDF gerado com sucesso!', { id: loadingToast });
      } else {
        throw new Error('URL do PDF não retornada');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao gerar PDF', { id: loadingToast });
    }
  };

  const faturasFiltradas = faturas.filter(f => filtro === "todos" ? true : f.status === filtro);
  const totalGeral = faturasFiltradas.reduce((acc, f) => acc + calculateTotalWithIss(f.items), 0);

  if (loading) {
    return <div style={styles.loadingContainer}><div style={styles.loading}>Carregando faturas...</div></div>;
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.error}>{error}</div>
        <button onClick={carregarDados} style={styles.retryButton}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={() => navigate("/home")} style={styles.backButton}>
              <FiArrowLeft />
            </button>
            <h1 style={styles.title}>Faturas</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.totalBox}>
              Total: <span style={styles.totalValue}>R$ {totalGeral.toFixed(2)}</span>
            </div>
            <button onClick={() => navigate("/faturas/nova")} style={styles.newButton}>
              <FiPlus size={20} /> Nova Fatura
            </button>
          </div>
        </div>

        <div style={styles.filters}>
          {[
            { key: "todos", label: "Todos" },
            { key: "PENDING", label: "Pendente" },
            { key: "PAID", label: "Paga" },
            { key: "CANCELED", label: "Cancelada" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key as FilterType)}
              style={{
                ...styles.filterButton,
                background: filtro === f.key ? "#00e5ff" : "transparent",
                color: filtro === f.key ? "#000" : "#00e5ff",
                border: filtro === f.key ? "none" : "1px solid #00e5ff40",
                boxShadow: filtro === f.key ? "0 4px 12px rgba(0, 229, 255, 0.4)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Nº</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Veículo</th>
                  <th style={styles.th}>Placa</th>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Total (R$)</th>
                  <th style={styles.th}>Pagamento</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {faturasFiltradas.map((f, index) => {
                  const cliente = f.client;
                  const totalComIss = calculateTotalWithIss(f.items);
                  return (
                    <tr key={f.id} style={{ ...styles.tableRow, background: index % 2 === 0 ? "#0f0f0f" : "#1a1a1a" }}>
                      <td style={styles.td}>{f.number || f.id}</td>
                      <td style={styles.td}>{cliente?.name || "Cliente não encontrado"}</td>
                      <td style={styles.td}>{cliente?.vehicle || "Não informado"}</td>
                      <td style={styles.td}>{cliente?.plate || ""}</td>
                      <td style={styles.td}>{new Date(f.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td style={{ ...styles.td, textAlign: "right", color: "#00e5ff", fontWeight: "600" }}>R$ {totalComIss.toFixed(2)}</td>
                      <td style={styles.td}>{getPaymentMethodLabel(f.paymentMethod)}</td>
                      <td style={styles.td}>
                        <select
                          value={f.status}
                          onChange={(e) => handleStatusChange(f, e.target.value as "PENDING" | "PAID" | "CANCELED")}
                          style={{ ...styles.statusSelect, color: getStatusColor(f.status) }}
                        >
                          <option value="PENDING">Pendente</option>
                          <option value="PAID">Paga</option>
                          <option value="CANCELED">Cancelada</option>
                        </select>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actions}>
                          <button onClick={() => navigate(`/clientes/ver/${f.clientId}`)} style={styles.actionButton} title="Ver cliente">
                            <FiEye size={16} />
                          </button>
                          <button onClick={() => handleExcluir(f.id)} style={{ ...styles.actionButton, color: "#ff5555", borderColor: "#ff555530" }} title="Excluir">
                            <FiTrash2 size={16} />
                          </button>
                          <button onClick={() => handlePDF(f)} style={styles.actionButton} title="Gerar PDF">
                            <FiFileText size={16} />
                          </button>
                          <button onClick={() => handleWhatsApp(f)} style={{ ...styles.actionButton, color: "#25D366", borderColor: "#25D36630" }} title="Enviar WhatsApp">
                            <FiMessageCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {faturasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={9} style={styles.emptyRow}>Nenhuma fatura encontrada.</td>
                  </tr>
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
  container: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    padding: "48px 24px",
    color: "#e0e0e0",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  innerContainer: { maxWidth: "1280px", margin: "0 auto" },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "40px",
    flexWrap: "wrap",
    gap: "20px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  backButton: {
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
  },
  title: {
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: "700",
    background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  headerRight: { display: "flex", gap: "16px", alignItems: "center" },
  totalBox: {
    background: "#1a1a1a",
    padding: "12px 24px",
    borderRadius: "100px",
    fontWeight: "600",
    fontSize: "1.1rem",
    color: "#00e5ff",
    border: "1px solid #00e5ff30",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
  },
  totalValue: { color: "#ffffff", marginLeft: "8px" },
  newButton: {
    background: "linear-gradient(135deg, #00e5ff, #0077ff)",
    color: "#000",
    padding: "12px 24px",
    borderRadius: "100px",
    fontWeight: "600",
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    boxShadow: "0 8px 20px rgba(0, 229, 255, 0.3)",
  },
  filters: { display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" },
  filterButton: {
    padding: "10px 24px",
    borderRadius: "100px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "all 0.2s",
  },
  tableContainer: {
    background: "#111",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
  },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "900px" },
  tableHeader: { background: "#1e1e1e", borderBottom: "2px solid #00e5ff30" },
  th: { padding: "20px 16px", textAlign: "left", fontWeight: "600", color: "#a0a0a0" },
  tableRow: { borderBottom: "1px solid #2a2a2a", transition: "background 0.2s" },
  td: { padding: "18px 16px", color: "#b0b0b0" },
  statusSelect: {
    background: "#1a1a1a",
    border: "1px solid #00e5ff40",
    padding: "8px 12px",
    borderRadius: "100px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.85rem",
    outline: "none",
  },
  actions: { display: "flex", gap: "12px", justifyContent: "center" },
  actionButton: {
    background: "#1a1a1a",
    border: "1px solid #00e5ff30",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#00e5ff",
  },
  emptyRow: { padding: "60px 16px", textAlign: "center", color: "#888", fontStyle: "italic" },
  loadingContainer: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loading: { color: "#00e5ff", fontSize: "18px" },
  errorContainer: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
  },
  error: { color: "#ff4444", fontSize: "18px" },
  retryButton: {
    background: "#00e5ff",
    color: "#000",
    border: "none",
    padding: "12px 24px",
    borderRadius: "100px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
};