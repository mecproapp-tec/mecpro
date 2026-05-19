import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiTrash2, FiTrash } from "react-icons/fi";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllReadNotifications, type Notification } from "../../../services/notifications";
import toast from "react-hot-toast";

export default function Notificacoes() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Erro ao carregar notificações", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    window.dispatchEvent(new CustomEvent("notificationCountUpdated"));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    window.dispatchEvent(new CustomEvent("notificationCountUpdated"));
    toast.success("Todas notificações marcadas como lidas");
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta notificação?")) return;
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new CustomEvent("notificationCountUpdated"));
      toast.success("Notificação excluída");
    } catch (error) {
      toast.error("Erro ao excluir notificação");
    }
  };

  const handleDeleteAllRead = async () => {
    const readCount = notifications.filter(n => n.read).length;
    if (readCount === 0) {
      toast.error("Não há notificações lidas para excluir");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir todas as ${readCount} notificações lidas?`)) return;
    try {
      const result = await deleteAllReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
      window.dispatchEvent(new CustomEvent("notificationCountUpdated"));
      toast.success(`${result.count} notificações lidas excluídas`);
    } catch (error) {
      toast.error("Erro ao excluir notificações lidas");
    }
  };

  if (loading) return <div style={styles.loading}>Carregando...</div>;

  const hasUnread = notifications.some(n => !n.read);
  const hasRead = notifications.some(n => n.read);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate("/home")} style={styles.backButton}>
          <FiArrowLeft size={24} />
        </button>
        <h1 style={styles.title}>Notificações</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          {hasRead && (
            <button onClick={handleDeleteAllRead} style={styles.deleteAllButton}>
              <FiTrash size={16} /> Excluir lidas
            </button>
          )}
          {hasUnread && (
            <button onClick={handleMarkAllAsRead} style={styles.markAllButton}>
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <p style={styles.empty}>Sem notificações</p>
      ) : (
        <ul style={styles.list}>
          {notifications.map(notif => (
            <li
              key={notif.id}
              style={{
                ...styles.item,
                background: notif.read ? "#111" : "#00e5ff10",
                borderLeft: notif.read ? "4px solid transparent" : "4px solid #00e5ff",
              }}
            >
              <div style={styles.itemContent} onClick={() => !notif.read && handleMarkAsRead(notif.id)}>
                <div style={styles.itemTitle}>{notif.title}</div>
                <div style={styles.itemMessage}>{notif.message}</div>
                <div style={styles.itemDate}>{new Date(notif.createdAt).toLocaleString()}</div>
              </div>
              <button
                onClick={(e) => handleDelete(notif.id, e)}
                style={styles.deleteButton}
                title="Excluir"
              >
                <FiTrash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
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
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px",
    flexWrap: "wrap" as const,
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
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    background: "linear-gradient(135deg,#00e5ff,#7fdbff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    flex: 1,
  },
  markAllButton: {
    background: "transparent",
    border: "1px solid #00e5ff",
    color: "#00e5ff",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  deleteAllButton: {
    background: "transparent",
    border: "1px solid #ff5555",
    color: "#ff5555",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
  },
  empty: {
    textAlign: "center",
    color: "#888",
    marginTop: "60px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  item: {
    background: "#111",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "background 0.2s",
    overflow: "hidden",
  },
  itemContent: {
    flex: 1,
    padding: "16px",
    cursor: "pointer",
  },
  itemTitle: {
    fontWeight: "bold",
    marginBottom: "4px",
  },
  itemMessage: {
    color: "#ccc",
    fontSize: "14px",
  },
  itemDate: {
    color: "#888",
    fontSize: "12px",
    marginTop: "8px",
  },
  deleteButton: {
    background: "transparent",
    border: "none",
    color: "#ff5555",
    cursor: "pointer",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    marginRight: "8px",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    color: "#00e5ff",
  },
};