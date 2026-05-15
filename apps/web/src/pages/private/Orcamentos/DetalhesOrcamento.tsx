import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiPrinter, FiFileText } from 'react-icons/fi';
import { getEstimateById, sendEstimateWhatsApp, convertEstimate, type Estimate } from '../../../services/Estimates';

export const DetalhesOrcamento: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const data = await getEstimateById(Number(id));
        setEstimate(data);
      } catch (err: any) {
        console.error('Erro ao carregar orçamento:', err);
        setError(err.response?.data?.message || 'Orçamento não encontrado.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEstimate();
  }, [id]);

  const handleSendWhatsApp = async () => {
    if (!estimate || !estimate.client?.phone) {
      setError('Cliente não possui telefone cadastrado');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const result = await sendEstimateWhatsApp(estimate.id, estimate.client.phone);
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
      } else {
        alert('Mensagem enviada com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao enviar WhatsApp:', err);
      setError(err.response?.data?.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!estimate) return;
    setConverting(true);
    setError(null);
    try {
      const result = await convertEstimate(estimate.id);
      alert(`Orçamento convertido em fatura #${result.invoiceId} com sucesso!`);
      navigate(`/faturas/${result.invoiceId}`);
    } catch (err: any) {
      console.error('Erro ao converter:', err);
      setError(err.response?.data?.message || 'Erro ao converter orçamento em fatura');
    } finally {
      setConverting(false);
    }
  };

  const handleViewPdf = () => {
    if (estimate?.pdfUrl) {
      window.open(estimate.pdfUrl, '_blank');
    } else {
      setError('PDF ainda não disponível. Tente novamente em alguns instantes.');
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      DRAFT: { color: '#6c757d', label: 'Rascunho' },
      SENT: { color: '#007bff', label: 'Enviado' },
      APPROVED: { color: '#28a745', label: 'Aprovado' },
      CONVERTED: { color: '#17a2b8', label: 'Convertido' },
    };
    const config = statusConfig[status] || { color: '#6c757d', label: status };
    return (
      <span
        style={{
          background: config.color,
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.innerContainer}>
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '40px' }}>Carregando orçamento...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div style={styles.container}>
        <div style={styles.innerContainer}>
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '40px', color: '#ff8888' }}>
              {error || 'Orçamento não encontrado'}
            </div>
            <button onClick={() => navigate('/orcamentos')} style={styles.backButtonSmall}>
              Voltar para lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <div style={styles.header}>
          <button
            onClick={() => navigate('/orcamentos')}
            style={styles.backButton}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1a1a1a')}
          >
            <FiArrowLeft />
          </button>
          <h1 style={styles.title}>Orçamento #{estimate.id}</h1>
          <div>{getStatusBadge(estimate.status)}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Informações do Cliente</h3>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Nome:</span>
              <span style={styles.infoValue}>{estimate.client?.name || '-'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Telefone:</span>
              <span style={styles.infoValue}>{estimate.client?.phone || 'Não cadastrado'}</span>
            </div>
            {estimate.client?.vehicle && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Veículo:</span>
                <span style={styles.infoValue}>{estimate.client.vehicle}</span>
              </div>
            )}
            {estimate.client?.plate && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Placa:</span>
                <span style={styles.infoValue}>{estimate.client.plate}</span>
              </div>
            )}
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Data:</span>
              <span style={styles.infoValue}>{formatDate(estimate.date)}</span>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Itens</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.tableCell}>Descrição</th>
                  <th style={{ ...styles.tableCell, textAlign: 'center' }}>Qtd</th>
                  <th style={{ ...styles.tableCell, textAlign: 'right' }}>Preço</th>
                  <th style={{ ...styles.tableCell, textAlign: 'right' }}>ISS</th>
                  <th style={{ ...styles.tableCell, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.items?.map((item, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.tableCell}>{item.description}</td>
                    <td style={{ ...styles.tableCell, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>{item.issPercent ? `${item.issPercent}%` : '-'}</td>
                    <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency((item.price * item.quantity) * (1 + (item.issPercent || 0) / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={styles.tableTotalRow}>
                  <td colSpan={4} style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '600' }}>TOTAL:</td>
                  <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '700', color: '#00e5ff' }}>
                    {formatCurrency(estimate.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={styles.actions}>
            {estimate.pdfUrl && (
              <button onClick={handleViewPdf} style={{ ...styles.button, background: '#6c757d' }}>
                <FiPrinter /> Visualizar PDF
              </button>
            )}
            {estimate.client?.phone && estimate.status !== 'CONVERTED' && (
              <button onClick={handleSendWhatsApp} disabled={sending} style={{ ...styles.button, background: '#25D366' }}>
                <FiSend /> {sending ? 'Enviando...' : 'Enviar WhatsApp'}
              </button>
            )}
            {estimate.status !== 'CONVERTED' && estimate.status !== 'APPROVED' && (
              <button onClick={handleConvertToInvoice} disabled={converting} style={{ ...styles.button, background: '#007bff' }}>
                <FiFileText /> {converting ? 'Convertendo...' : 'Converter em Fatura'}
              </button>
            )}
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    padding: "48px 24px",
    color: "#e0e0e0",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  innerContainer: { maxWidth: "800px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" },
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
  backButtonSmall: {
    background: "#1a1a1a",
    border: "none",
    color: "#00e5ff",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "16px",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 40px)",
    fontWeight: "700",
    background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    flex: 1,
  },
  card: {
    background: "#111",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
  },
  section: { marginBottom: "32px" },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#00e5ff",
    marginBottom: "16px",
    borderBottom: "1px solid #333",
    paddingBottom: "8px",
  },
  infoRow: { display: "flex", padding: "8px 0", borderBottom: "1px solid #222" },
  infoLabel: { width: "120px", fontWeight: "600", color: "#a0a0a0" },
  infoValue: { flex: 1, color: "#fff" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  tableHeader: { borderBottom: "2px solid #333" },
  tableRow: { borderBottom: "1px solid #222" },
  tableTotalRow: { borderTop: "2px solid #333", fontWeight: "600" },
  tableCell: { padding: "12px 8px", textAlign: "left" as const },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #333",
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "14px",
  },
  errorBox: {
    background: "#ff444420",
    border: "1px solid #ff4444",
    color: "#ff8888",
    padding: "12px 16px",
    borderRadius: "12px",
    marginTop: "16px",
  },
};

export default DetalhesOrcamento;