import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import { getClientById, type Client } from "../../../services/clients";
import { createAppointment } from "../../../services/appointments";

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

const getBrazilNow = (): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
};

export default function Agendamento() {
  const navigate = useNavigate();
  const { clienteId } = useParams();

  const [cliente, setCliente] = useState<Client | null>(null);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clienteId) return;
    carregarCliente();
  }, [clienteId]);

  const carregarCliente = async () => {
    try {
      const clienteData = await getClientById(Number(clienteId));
      setCliente(clienteData);
    } catch {
      setError("Erro ao carregar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (saving) return;
    if (!cliente) return;
    if (!data || !hora) {
      alert("Preencha data e hora");
      return;
    }

    const selected = new Date(`${data}T${hora}:00`);
    const nowBrazil = getBrazilNow();

    if (selected < nowBrazil) {
      alert("Não é possível agendar no passado (horário de Brasília)");
      return;
    }

    setSaving(true);
    try {
      const localDate = new Date(`${data}T${hora}:00`);
      const dateTime = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString();

      await createAppointment({
        clientId: cliente.id,
        date: dateTime,
        comment: comentarios || undefined,
      });

      alert("Agendamento salvo com sucesso");
      navigate(`/clientes/ver/${cliente.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao salvar agendamento");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Carregando cliente...</div>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div style={styles.errorContainer}>
        <p>{error || "Cliente não encontrado"}</p>
        <button onClick={() => navigate("/clientes")} style={styles.backButton}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backIcon}>
        <FiArrowLeft />
      </button>

      <div style={styles.content}>
        <h1 style={styles.title}>Agendamento - {cliente.name}</h1>

        <div style={styles.form}>
          <label style={styles.label}>
            Data
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={styles.input}
              required
              disabled={saving}
            />
          </label>

          <label style={styles.label}>
            Hora
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              style={styles.input}
              required
              disabled={saving}
            />
          </label>

          <label style={styles.label}>
            Comentários
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              style={{ ...styles.input, minHeight: "100px" }}
              disabled={saving}
            />
          </label>

          <button
            onClick={handleSalvar}
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            <FiSave />
            {saving ? "Salvando..." : "Salvar Agendamento"}
          </button>
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
    position: "relative" as const,
  },
  backIcon: {
    position: "absolute" as const,
    top: "20px",
    left: "20px",
    background: "transparent",
    border: "none",
    color: "#00e5ff",
    fontSize: "30px",
    cursor: "pointer",
  },
  content: {
    maxWidth: "600px",
    margin: "0 auto",
  },
  title: {
    fontSize: "42px",
    fontWeight: 800,
    textShadow: "0 0 15px #00e5ff",
    marginBottom: "32px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  label: {
    display: "block",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginTop: "4px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#111",
    color: "#00e5ff",
    fontSize: "16px",
  },
  saveButton: {
    background: "#00e5ff",
    color: "#000",
    padding: "12px",
    borderRadius: "6px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "none",
    marginTop: "16px",
    fontSize: "16px",
  },
  loadingContainer: {
    background: "#000",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#00e5ff",
  },
  loading: {
    fontSize: "18px",
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
    cursor: "pointer",
  },
};