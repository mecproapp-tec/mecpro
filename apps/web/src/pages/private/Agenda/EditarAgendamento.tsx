import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import { getAppointmentById, updateAppointment } from "../../../services/appointments";

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

// Formata a data/hora recebida do backend (já convertida para o fuso Brasil) para os campos <input>
const formatBrazilDateTimeForInput = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
};

// Retorna a data/hora atual no horário de Brasília
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

export default function EditarAgendamento() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [agendamento, setAgendamento] = useState<any>(null);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    carregarAgendamento();
  }, [id]);

  const carregarAgendamento = async () => {
    try {
      const app = await getAppointmentById(Number(id));
      setAgendamento(app);

      // A data vinda do backend já está no fuso Brasil (convertida pelo service)
      const dateObj = new Date(app.date);
      const { date: dataStr, time: horaStr } = formatBrazilDateTimeForInput(dateObj);

      setData(dataStr);
      setHora(horaStr);
      setComentarios(app.comment || "");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (saving) return;
    if (!agendamento) return;
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
      const dateTime = `${data}T${hora}:00`;

      await updateAppointment(agendamento.id, {
        clientId: agendamento.clientId,
        date: dateTime,
        comment: comentarios || undefined,
      });

      alert("Agendamento atualizado com sucesso");
      navigate("/agenda");
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao atualizar agendamento");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Carregando agendamento...</div>;
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

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backIcon}>
            <FiArrowLeft size={32} />
          </button>
          <h1 style={styles.title}>Editar Agendamento</h1>
        </div>

        <div style={styles.card}>
          <h2 style={styles.subtitle}>Cliente: {agendamento.client?.name || "—"}</h2>

          <div style={styles.form}>
            <label style={styles.label}>
              Data
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                style={styles.input}
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
              {saving ? "Salvando..." : "Atualizar Agendamento"}
            </button>
          </div>
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
  },
  subtitle: {
    marginBottom: "16px",
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
    background: "#000",
    color: "#00e5ff",
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
  },
  loadingContainer: {
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