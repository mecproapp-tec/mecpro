import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { getAppointmentById } from "../../../services/appointments";

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

// Formata a data para exibição no padrão brasileiro (dd/MM/yyyy HH:mm)
const formatBrazilDateTime = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const [datePart, timePart] = formatter.format(date).split(' ');
  return { date: datePart, time: timePart };
};

export default function VerAgendamento() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [agendamento, setAgendamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    carregarAgendamento();
  }, [id]);

  const carregarAgendamento = async () => {
    try {
      const app = await getAppointmentById(Number(id));
      setAgendamento(app);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar agendamento");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  if (error || !agendamento) {
    return (
      <div style={styles.errorContainer}>
        <p>{error || "Agendamento não encontrado"}</p>
        <button onClick={() => navigate("/clientes")} style={styles.backButton}>
          Voltar
        </button>
      </div>
    );
  }

  const dateObj = new Date(agendamento.date);
  const { date: dataStr, time: horaStr } = formatBrazilDateTime(dateObj);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backIcon}>
            <FiArrowLeft size={32} />
          </button>
          <h1 style={styles.title}>Detalhes do Agendamento</h1>
        </div>

        <div style={styles.card}>
          <p><strong>Cliente:</strong> {agendamento.client?.name || "—"}</p>
          <p><strong>Placa:</strong> {agendamento.client?.plate || "—"}</p>
          <p><strong>Data:</strong> {dataStr}</p>
          <p><strong>Hora:</strong> {horaStr}</p>
          <p><strong>Comentários:</strong> {agendamento.comment || "-"}</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#000",
    minHeight: "100vh",
    padding: "32px",
    color: "#00e5ff",
  },
  content: {
    maxWidth: "600px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "32px",
  },
  backIcon: {
    background: "transparent",
    border: "none",
    color: "#00e5ff",
    cursor: "pointer",
    marginRight: "16px",
  },
  title: {
    fontSize: "42px",
    fontWeight: 800,
    textShadow: "0 0 15px #00e5ff",
    margin: 0,
  },
  card: {
    background: "#111",
    padding: "24px",
    borderRadius: "12px",
    lineHeight: 2,
  },
  loading: {
    background: "#000",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#00e5ff",
  },
  errorContainer: {
    background: "#000",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: "#ff4444",
  },
  backButton: {
    marginTop: "20px",
    padding: "10px 20px",
    background: "#00e5ff",
    border: "none",
    borderRadius: "8px",
    color: "#000",
  },
};