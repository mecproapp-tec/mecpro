import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiEdit, FiTrash2, FiCalendar, FiPlus, FiClock, FiArrowLeft, FiEye } from "react-icons/fi";

import { getClients, deleteClient, type Client, getVehicleDisplay } from "../../../services/clients";
import { getAppointments, type Appointment } from "../../../services/appointments";

export default function Clientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clientes, setClientes] = useState<Client[]>([]);
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔧 Função segura para formatar data/hora com fuso de Brasília
  const formatarDataHora = (data: any): string => {
    if (!data) return "Sem agendamento";
    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) return "Data inválida";
      return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    } catch {
      return "Data inválida";
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      console.log("🔄 Carregando clientes...");
      const clientesData = await getClients();
      console.log("✅ Clientes carregados:", clientesData);
      setClientes(Array.isArray(clientesData) ? clientesData : []);

      try {
        const agendamentosData = await getAppointments();
        setAgendamentos(Array.isArray(agendamentosData) ? agendamentosData : []);
      } catch (err) {
        console.warn("Agendamentos não disponíveis", err);
        setAgendamentos([]);
      }
    } catch (err: any) {
      console.error("❌ Erro ao carregar clientes:", err);
      setError(err.response?.data?.message || "Erro ao carregar clientes");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [location.key, refreshKey]);

  const refreshClientes = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExcluir = async (id: number) => {
    const confirmar = confirm("Tem certeza que deseja excluir este cliente?");
    if (!confirmar) return;

    try {
      await deleteClient(id);
      setClientes(clientes.filter(c => c.id !== id));
      refreshClientes();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao excluir cliente");
    }
  };

  const proximoAgendamentoPorCliente = useMemo(() => {
    const agora = new Date();
    const futuros = agendamentos
      .filter(a => new Date(a.date) > agora)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const map = new Map<number, Appointment>();
    for (const a of futuros) {
      if (!map.has(a.clientId)) {
        map.set(a.clientId, a);
      }
    }
    return map;
  }, [agendamentos]);

  const obterProximoAgendamento = (clienteId: number): Appointment | null => {
    return proximoAgendamentoPorCliente.get(clienteId) || null;
  };

  const abrirAgendamento = (appointmentId: number) => {
    navigate(`/agendamento/ver/${appointmentId}`);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Carregando clientes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.error}>{error}</div>
        <button
          onClick={carregarDados}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "#00e5ff",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
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
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/home")}
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
                boxShadow: "0 4px 12px rgba(0,229,255,0.2)",
              }}
            >
              <FiArrowLeft />
            </button>

            <h1
              style={{
                fontSize: "clamp(32px,5vw,48px)",
                fontWeight: "700",
                background: "linear-gradient(135deg,#00e5ff,#7fdbff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              Clientes
            </h1>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div
              style={{
                background: "#1a1a1a",
                padding: "12px 24px",
                borderRadius: "100px",
                fontWeight: "600",
                color: "#00e5ff",
                border: "1px solid #00e5ff30",
              }}
            >
              Total:{" "}
              <span style={{ color: "#fff", marginLeft: "8px" }}>
                {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
              </span>
            </div>

            <button
              onClick={() => navigate("/clientes/novo")}
              style={{
                background: "linear-gradient(135deg,#00e5ff,#0077ff)",
                color: "#000",
                padding: "12px 24px",
                borderRadius: "100px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiPlus size={20} />
              Novo Cliente
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {clientes.length > 0 ? (
            clientes.map(cliente => {
              const proximoAgendamento = obterProximoAgendamento(cliente.id);

              return (
                <div
                  key={cliente.id}
                  style={{
                    background: "#111",
                    borderRadius: "24px",
                    padding: "24px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.8),0 0 0 1px #00e5ff20",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "32px",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "1.2rem", color: "#fff" }}>
                        {cliente.name}
                      </span>
                      <span style={{ color: "#b0b0b0" }}>{cliente.vehicle || "Não informado"}</span>
                      <span style={{ color: "#b0b0b0", fontFamily: "monospace" }}>
                        {cliente.plate || "Não informado"}
                      </span>

                      {proximoAgendamento && (
                        <button
                          onClick={() => abrirAgendamento(proximoAgendamento.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #00ff9940",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#00ff99",
                            padding: "4px 12px",
                            borderRadius: "100px",
                            fontSize: "0.9rem",
                          }}
                        >
                          <FiClock size={16} />
                          {formatarDataHora(proximoAgendamento.date)}
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        onClick={() => navigate(`/clientes/ver/${cliente.id}`)}
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #00e5ff30",
                          color: "#00e5ff",
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <FiEye size={18} />
                      </button>

                      <button
                        onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #00e5ff30",
                          color: "#00e5ff",
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <FiEdit size={18} />
                      </button>

                      <button
                        onClick={() => handleExcluir(cliente.id)}
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #ff555530",
                          color: "#ff5555",
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <FiTrash2 size={18} />
                      </button>

                      <button
                        onClick={() => navigate(`/agendamento/novo/${cliente.id}`)}
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #00ff9940",
                          color: "#00ff99",
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <FiCalendar size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 16px",
                background: "#111",
                borderRadius: "24px",
                color: "#888",
                fontStyle: "italic",
              }}
            >
              Nenhum cliente cadastrado.
              <br />
              <button
                onClick={() => navigate("/clientes/novo")}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  background: "#00e5ff",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cadastrar primeiro cliente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    color: "#00e5ff",
    fontSize: "18px",
  },
  errorContainer: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "#ff4444",
    fontSize: "18px",
  },
};