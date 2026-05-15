import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { getNotifications, markAsRead, markAllAsRead, type Notification } from "../../../services/notifications";

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
    // 🔥 Dispara evento global para atualizar o badge do sininho
    window.dispatchEvent(new CustomEvent("notificationCountUpdated"));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    window.dispatchEvent(new CustomEvent("notificationCountUpdated"));
  };

  if (loading) return <div style={styles.loading}>Carregando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate("/home")} style={styles.backButton}>
          <FiArrowLeft size={24} />
        </button>
        <h1 style={styles.title}>Notificações</h1>
        {notifications.some(n => !n.read) && (
          <button onClick={handleMarkAllAsRead} style={styles.markAllButton}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p style={styles.empty}>sem notificações</p>
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
              onClick={() => !notif.read && handleMarkAsRead(notif.id)}
            >
              <div style={styles.itemTitle}>{notif.title}</div>
              <div style={styles.itemMessage}>{notif.message}</div>
              <div style={styles.itemDate}>{new Date(notif.createdAt).toLocaleString()}</div>
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
    padding: "16px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background 0.2s",
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
  loading: {
    textAlign: "center",
    padding: "50px",
    color: "#00e5ff",
  },
};