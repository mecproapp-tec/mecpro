import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiTrash2, FiBell } from "react-icons/fi";
import toast from "react-hot-toast";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, type Notification } from "../../../services/notifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Notificacoes() {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const carregarNotificacoes = async () => {
    setLoading(true);
    try {
      const response = await getNotifications(page, 50);
      setNotificacoes(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      
      const naoLidas = response.data.filter(n => !n.read).length;
      if (naoLidas === 0) {
        window.dispatchEvent(new Event("notificationCountUpdated"));
      }
    } catch (error) {
      console.error("Erro ao carregar notificações", error);
      toast.error("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNotificacoes();
  }, [page]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotificacoes(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      window.dispatchEvent(new Event("notificationCountUpdated"));
      toast.success("Notificação marcada como lida");
    } catch (error) {
      toast.error("Erro ao marcar como lida");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotificacoes(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      window.dispatchEvent(new Event("notificationCountUpdated"));
      toast.success("Todas notificações marcadas como lidas");
    } catch (error) {
      toast.error("Erro ao marcar todas como lidas");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta notificação?")) return;
    try {
      await deleteNotification(id);
      setNotificacoes(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event("notificationCountUpdated"));
      toast.success("Notificação excluída");
    } catch (error) {
      toast.error("Erro ao excluir notificação");
    }
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (loading && page === 1) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Carregando notificações...</div>
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
            <h1 style={styles.title}>Notificações</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.totalBox}>
              <FiBell size={18} style={{ marginRight: "8px" }} />
              <span>{total} notificações</span>
            </div>
            {notificacoes.some(n => !n.read) && (
              <button onClick={handleMarkAllAsRead} style={styles.markAllButton}>
                <FiCheckCircle size={18} style={{ marginRight: "8px" }} />
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        <div style={styles.listContainer}>
          {notificacoes.length === 0 ? (
            <div style={styles.emptyState}>
              <FiBell size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            notificacoes.map(notificacao => (
              <div
                key={notificacao.id}
                style={{
                  ...styles.card,
                  background: notificacao.read ? "#111" : "#1a1a1a",
                  border: notificacao.read ? "1px solid #2a2a2a" : "1px solid #00e5ff40",
                }}
              >
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{notificacao.title}</h3>
                    <span style={styles.cardDate}>{formatarData(notificacao.createdAt)}</span>
                  </div>
                  <p style={styles.cardMessage}>{notificacao.message}</p>
                </div>
                <div style={styles.cardActions}>
                  {!notificacao.read && (
                    <button
                      onClick={() => handleMarkAsRead(notificacao.id)}
                      style={styles.readButton}
                      title="Marcar como lida"
                    >
                      <FiCheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notificacao.id)}
                    style={styles.deleteButton}
                    title="Excluir notificação"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ ...styles.pageButton, opacity: page === 1 ? 0.5 : 1 }}
            >
              Anterior
            </button>
            <span style={styles.pageInfo}>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ ...styles.pageButton, opacity: page === totalPages ? 0.5 : 1 }}
            >
              Próxima
            </button>
          </div>
        )}
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
  innerContainer: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "40px",
    flexWrap: "wrap",
    gap: "20px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
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
  },
  headerRight: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  totalBox: {
    background: "#1a1a1a",
    padding: "10px 20px",
    borderRadius: "100px",
    fontSize: "14px",
    color: "#00e5ff",
    border: "1px solid #00e5ff30",
    display: "flex",
    alignItems: "center",
  },
  markAllButton: {
    background: "linear-gradient(135deg, #00e5ff, #0077ff)",
    color: "#000",
    padding: "10px 20px",
    borderRadius: "100px",
    fontWeight: "600",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s",
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    background: "#111",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    transition: "all 0.2s",
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "8px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "#fff",
  },
  cardDate: {
    fontSize: "12px",
    color: "#888",
  },
  cardMessage: {
    fontSize: "14px",
    color: "#b0b0b0",
    margin: 0,
    lineHeight: 1.5,
  },
  cardActions: {
    display: "flex",
    gap: "12px",
    marginLeft: "16px",
  },
  readButton: {
    background: "#1a1a1a",
    border: "1px solid #00ff8830",
    color: "#00ff88",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  deleteButton: {
    background: "#1a1a1a",
    border: "1px solid #ff555530",
    color: "#ff5555",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#111",
    borderRadius: "24px",
    color: "#888",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "32px",
  },
  pageButton: {
    background: "#1a1a1a",
    border: "1px solid #00e5ff40",
    color: "#00e5ff",
    padding: "10px 20px",
    borderRadius: "100px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  pageInfo: {
    color: "#a0a0a0",
    fontSize: "14px",
  },
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
};