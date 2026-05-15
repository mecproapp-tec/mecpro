import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import { getClientById, type Client } from "../../../services/clients";
import { createAppointment } from "../../../services/appointments";

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

    // Monta a data/hora no fuso local do navegador (que deve ser o de Brasília)
    const dataHoraLocalStr = `${data}T${hora}:00`;
    const dataHoraLocal = new Date(dataHoraLocalStr);

    // Valida se não é passado
    if (dataHoraLocal < new Date()) {
      alert("Não é possível agendar no passado");
      return;
    }

    // Converte para UTC (formato ISO)
    const dataUTCString = dataHoraLocal.toISOString();

    setSaving(true);
    try {
      await createAppointment({
        clientId: cliente.id,
        date: dataUTCString,
        comment: comentarios || undefined,
      });

      alert("Agendamento salvo com sucesso");
      navigate("/clientes");
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
  container: { background: "#000", minHeight: "100vh", padding: "32px", color: "#00e5ff", position: "relative" as const },
  backIcon: { position: "absolute" as const, top: "20px", left: "20px", background: "transparent", border: "none", color: "#00e5ff", fontSize: "30px", cursor: "pointer" },
  content: { maxWidth: "600px", margin: "0 auto" },
  title: { fontSize: "42px", fontWeight: 800, textShadow: "0 0 15px #00e5ff", marginBottom: "32px" },
  form: { display: "flex", flexDirection: "column" as const, gap: "16px" },
  label: { display: "block" },
  input: { width: "100%", padding: "12px", marginTop: "4px", borderRadius: "6px", border: "1px solid #333", background: "#111", color: "#00e5ff", fontSize: "16px" },
  saveButton: { background: "#00e5ff", color: "#000", padding: "12px", borderRadius: "6px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", border: "none", marginTop: "16px", fontSize: "16px" },
  loadingContainer: { background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#00e5ff" },
  loading: { fontSize: "18px" },
  errorContainer: { background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", color: "#ff4444" },
  backButton: { marginTop: "20px", padding: "10px 20px", background: "#00e5ff", border: "none", borderRadius: "8px", color: "#000", cursor: "pointer" },
};