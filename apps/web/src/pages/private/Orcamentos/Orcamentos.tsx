import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiPlus,
  FiArrowLeft,
  FiFileText,
  FiMessageCircle,
  FiEye,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getEstimates, getConvertedEstimates, deleteEstimate, updateEstimate, sendEstimateWhatsApp, type Estimate, resendEstimatePdf } from "../../../services/Estimates";
import { getClientById, getVehicleDisplay, type Client } from "../../../services/clients";
import api from "../../../services/api";

type FilterType = "todos" | "accepted" | "pending" | "converted";

const statusMap: Record<string, string> = {
  pending: "DRAFT",
  accepted: "APPROVED",
  converted: "CONVERTED",
};

const reverseStatusMap: Record<string, string> = {
  DRAFT: "pending",
  APPROVED: "accepted",
  CONVERTED: "converted",
};

const displayStatusMap: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  converted: "Convertido",
  DRAFT: "Pendente",
  APPROVED: "Aceito",
  CONVERTED: "Convertido",
};

function getStatusLabel(status: string): string {
  return displayStatusMap[status] || status;
}

function getPaymentMethodLabel(method?: string): string {
  switch (method) {
    case 'CREDIT_CARD': return 'Cartão Crédito';
    case 'DEBIT_CARD': return 'Cartão Débito';
    case 'BANK_TRANSFER': return 'Transferência';
    case 'PIX': return 'PIX';
    default: return '—';
  }
}

export default function Orcamentos() {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Estimate[]>([]);
  const [filtro, setFiltro] = useState<FilterType>("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [convertingIds, setConvertingIds] = useState<Set<number>>(new Set());

  const carregarDados = async () => {
    setLoading(true);
    try {
      let response;
      if (filtro === "converted") {
        response = await getConvertedEstimates(1, 100);
      } else {
        response = await getEstimates(1, 100);
      }
      
      let estimatesData: Estimate[] = [];
      
      if (Array.isArray(response)) {
        estimatesData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          estimatesData = response.data;
        } else if (Array.isArray(response.estimates)) {
          estimatesData = response.estimates;
        } else if (Array.isArray(response.items)) {
          estimatesData = response.items;
        } else if (Array.isArray(response.data?.data)) {
          estimatesData = response.data.data;
        } else {
          estimatesData = [];
        }
      }
      
      const convertedEstimates = estimatesData.map(est => ({
        ...est,
        status: reverseStatusMap[est.status] || est.status,
        items: est.items || [],
        total: typeof est.total === 'string' ? parseFloat(est.total) : (est.total || 0),
        paymentMethod: est.paymentMethod,
      }));
      
      setOrcamentos(convertedEstimates);
      await carregarClientesFaltantes(convertedEstimates);
      
    } catch (err: any) {
      console.error("Erro ao carregar:", err);
      setError(err.response?.data?.message || "Erro ao carregar orçamentos");
      setOrcamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarClientesFaltantes = async (estimates: Estimate[]) => {
    const missingClientIds = estimates
      .filter(est => !est.client && typeof est.clientId === 'number' && est.clientId > 0)
      .map(est => est.clientId)
      .filter((id, index, self) => self.indexOf(id) === index);

    if (missingClientIds.length === 0) return;

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

    setOrcamentos(prev =>
      prev.map(est => ({
        ...est,
        client: est.client || clientMap.get(est.clientId) || undefined,
      }))
    );
  };

  useEffect(() => {
    carregarDados();
  }, [filtro]);

  const handleExcluir = async (id: number) => {
    const confirmar = confirm("Tem certeza que deseja excluir este orçamento?");
    if (!confirmar) return;
    try {
      await deleteEstimate(id);
      setOrcamentos(orcamentos.filter((o) => o.id !== id));
      toast.success("Orçamento excluído com sucesso!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao excluir orçamento");
    }
  };

  const handleStatusChange = async (orcamento: Estimate, novoStatus: "accepted" | "pending") => {
    if (!orcamento.clientId) {
      toast.error("Cliente inválido para este orçamento.");
      return;
    }

    if (orcamento.status === novoStatus) return;

    try {
      const payload = {
        status: statusMap[novoStatus],
      };

      await updateEstimate(orcamento.id, payload);

      setOrcamentos(prev =>
        prev.map(o => (o.id === orcamento.id ? { ...o, status: novoStatus } : o))
      );

      toast.success(`Status alterado para ${getStatusLabel(novoStatus)}`);
    } catch (err: any) {
      console.error("Erro no updateStatus:", err);
      toast.error(err.response?.data?.message || "Erro ao alterar status");
    }
  };

  const handleConverter = async (orcamento: Estimate) => {
    if (convertingIds.has(orcamento.id)) {
      toast.error("Este orçamento já está sendo convertido. Aguarde...");
      return;
    }

    if (!orcamento.clientId || typeof orcamento.clientId !== 'number' || orcamento.clientId <= 0) {
      toast.error("Este orçamento não possui um cliente válido. Não é possível converter.");
      return;
    }

    if (orcamento.status === "converted") {
      toast.error("Este orçamento já foi convertido em fatura.");
      return;
    }

    const confirmar = confirm(`Deseja converter o orçamento #${orcamento.id} em fatura?`);
    if (!confirmar) return;

    setConvertingIds(prev => new Set(prev).add(orcamento.id));

    try {
      const response = await api.post(`/estimates/${orcamento.id}/convert`);
      const result = response.data?.data || response.data;
      const invoiceId = result?.invoiceId || result?.invoice?.id;
      const invoiceNumber = result?.invoiceNumber || result?.invoice?.number;
      
      await carregarDados();
      
      if (invoiceId) {
        toast.success(
          (t) => (
            <span>
              ✅ Convertido para fatura #{invoiceNumber || invoiceId}
              <button
                onClick={() => {
                  toast.dismiss(t);
                  navigate(`/faturas/detalhes/${invoiceId}`);
                }}
                style={{ marginLeft: "12px", background: "#00e5ff", border: "none", borderRadius: "8px", padding: "4px 12px", cursor: "pointer", color: "#000" }}
              >
                Ver fatura
              </button>
            </span>
          ),
          { duration: 8000 }
        );
      } else {
        toast.success(`✅ Orçamento #${orcamento.id} convertido com sucesso!`);
      }
      
    } catch (err: any) {
      console.error("❌ Erro na conversão:", err);
      let errorMsg = err.response?.data?.message || "Erro ao converter orçamento em fatura";
      if (err.response?.status === 409) {
        errorMsg = "Este orçamento já foi convertido ou está duplicado.";
      } else if (err.code === "ECONNABORTED") {
        errorMsg = "Tempo esgotado. Verifique se a fatura foi criada (pode estar processando).";
      } else if (err.response?.status === 401) {
        errorMsg = "Sua sessão expirou. Recarregue a página e tente novamente.";
        window.location.reload();
      }
      toast.error(errorMsg);
    } finally {
      setConvertingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orcamento.id);
        return newSet;
      });
    }
  };

  const handleWhatsApp = async (item: Estimate, tipo: 'estimate' | 'invoice') => {
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
      const endpoint = tipo === 'estimate' ? 'estimates' : 'invoices';
      const response = await api.post(`/${endpoint}/${item.id}/send-whatsapp`, { phoneNumber: telefone });
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

  const handlePDF = async (orcamento: Estimate) => {
    const loadingToast = toast.loading('Gerando PDF...');
    try {
      const { pdfUrl } = await resendEstimatePdf(orcamento.id);
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

  const orcamentosFiltrados = orcamentos; // filtro já aplicado no backend
  const totalGeral = orcamentos
    .filter(o => o.status !== "converted")
    .reduce((acc, o) => acc + Number(o.total), 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Carregando orçamentos...</div>
      </div>
    );
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
            <h1 style={styles.title}>Orçamentos</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.totalBox}>
              Total: <span style={styles.totalValue}>R$ {totalGeral.toFixed(2)}</span>
            </div>
            <button onClick={() => navigate("/orcamentos/novo")} style={styles.newButton}>
              <FiPlus size={20} /> Novo Orçamento
            </button>
          </div>
        </div>

        <div style={styles.filters}>
          {[
            { key: "todos", label: "Todos" },
            { key: "accepted", label: "Aceito" },
            { key: "pending", label: "Pendente" },
            { key: "converted", label: "Convertido" },
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
                {orcamentosFiltrados.map((o, index) => {
                  const cliente = o.client;
                  const isConverted = o.status === "converted";
                  return (
                    <tr key={o.id} style={{ ...styles.tableRow, background: index % 2 === 0 ? "#0f0f0f" : "#1a1a1a" }}>
                      <td style={styles.td}>{cliente?.name || "Cliente não encontrado"}</td>
                      <td style={styles.td}>{cliente?.vehicle || "Não informado"}</td>
                      <td style={styles.td}>{cliente?.plate || ""}</td>
                      <td style={styles.td}>{new Date(o.date).toLocaleDateString("pt-BR")}</td>
                      <td style={{ ...styles.td, textAlign: "right", color: "#00e5ff", fontWeight: "600" }}>R$ {Number(o.total).toFixed(2)}</td>
                      <td style={styles.td}>{getPaymentMethodLabel(o.paymentMethod)}</td>
                      <td style={styles.td}>
                        {isConverted ? (
                          <span style={styles.convertedStatus}>{getStatusLabel(o.status)}</span>
                        ) : (
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o, e.target.value as "accepted" | "pending")}
                            style={styles.statusSelect}
                          >
                            <option value="accepted">Aceito</option>
                            <option value="pending">Pendente</option>
                          </select>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actions}>
                          <button onClick={() => navigate(`/clientes/ver/${o.clientId}`)} style={styles.actionButton} title="Ver cliente">
                            <FiEye size={16} />
                          </button>
                          <button onClick={() => handleExcluir(o.id)} style={{ ...styles.actionButton, color: "#ff5555", borderColor: "#ff555530" }} title="Excluir">
                            <FiTrash2 size={16} />
                          </button>
                          {!isConverted && (
                            <>
                              <button onClick={() => navigate(`/orcamentos/editar/${o.id}`)} style={styles.actionButton} title="Editar orçamento">
                                <FiEdit size={16} />
                              </button>
                              <button onClick={() => handleConverter(o)} style={{ ...styles.actionButton, color: "#ffcc00", borderColor: "#ffcc0030" }} title="Converter em Fatura">
                                <FiRefreshCw size={16} />
                              </button>
                            </>
                          )}
                          <button onClick={() => handlePDF(o)} style={styles.actionButton} title="Gerar PDF">
                            <FiFileText size={16} />
                          </button>
                          <button onClick={() => handleWhatsApp(o, 'estimate')} style={{ ...styles.actionButton, color: "#25D366", borderColor: "#25D36630" }} title="Enviar WhatsApp">
                            <FiMessageCircle size={16} />
                          </button>
                        </div>
                      </td>
                    <tr>
                  );
                })}
                {orcamentosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} style={styles.emptyRow}>Nenhum orçamento encontrado.</td>
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
  convertedStatus: {
    background: "#2a2a2a",
    color: "#ffaa00",
    padding: "6px 14px",
    borderRadius: "100px",
    fontWeight: "600",
    fontSize: "0.85rem",
    display: "inline-block",
    border: "1px solid #ffaa0040",
  },
  statusSelect: {
    background: "#1a1a1a",
    color: "#00e5ff",
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