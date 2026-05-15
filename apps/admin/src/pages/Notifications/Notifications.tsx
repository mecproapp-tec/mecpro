import { useState, useEffect } from "react";
import api from "../../services/api";
import { FiCheck, FiEye, FiMail, FiSearch, FiX, FiTrash2 } from "react-icons/fi";

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/admin/notifications");
      setNotifications(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Erro ao marcar como lida", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/admin/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Erro ao marcar todas como lidas", err);
    }
  };

  // ✅ Função para excluir notificação
  const deleteNotification = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta notificação?")) return;
    try {
      await api.delete(`/admin/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Erro ao excluir notificação", err);
      alert("Erro ao excluir notificação");
    }
  };

  // Filtros
  const filtered = notifications.filter(n => {
    if (tenantFilter && !n.tenant?.name?.toLowerCase().includes(tenantFilter.toLowerCase())) return false;
    if (readFilter === "read" && !n.read) return false;
    if (readFilter === "unread" && n.read) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <div className="p-6 text-center">Carregando...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-neonBlue">Notificações Enviadas</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-neonBlue text-blackBg px-4 py-2 rounded hover:bg-cyan-300 transition"
          >
            Marcar todas como lidas ({unreadCount})
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-gray900 p-4 rounded-lg border border-gray800 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-gray-400 text-sm mb-1">Buscar</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Título ou mensagem"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray800 border border-gray700 rounded-lg text-white"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-gray-400 text-sm mb-1">Tenant</label>
          <input
            type="text"
            placeholder="Nome do tenant"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-gray-400 text-sm mb-1">Status</label>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as any)}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Todos</option>
            <option value="read">Lidas</option>
            <option value="unread">Não lidas</option>
          </select>
        </div>
        <button
          onClick={() => {
            setSearch("");
            setTenantFilter("");
            setReadFilter("all");
          }}
          className="bg-gray700 text-white px-4 py-2 rounded-lg hover:bg-gray600 transition flex items-center gap-2"
        >
          <FiX /> Limpar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray800">
              <tr className="text-gray-400">
                <th className="p-4 text-left">Tenant</th>
                <th className="p-4 text-left">Título</th>
                <th className="p-4 text-left">Mensagem</th>
                <th className="p-4 text-left">Data</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
                </tr>
            </thead>
            <tbody>
              {paginated.map((notif) => (
                <tr key={notif.id} className="border-t border-gray800 hover:bg-gray800/50">
                  <td className="p-4 text-white">
                    {notif.tenant ? (
                      <div>
                        <div className="font-medium">{notif.tenant.name}</div>
                        <div className="text-xs text-gray-500">{notif.tenant.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="p-4 text-white font-medium">{notif.title}</td>
                  <td className="p-4 text-gray-300 max-w-md truncate" title={notif.message}>
                    {notif.message.length > 60 ? notif.message.substring(0, 60) + "…" : notif.message}
                  </td>
                  <td className="p-4 text-gray-300 whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {notif.read ? (
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <FiCheck size={14} /> Lida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-400">
                        <FiMail size={14} /> Não lida
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-neonBlue hover:text-white transition"
                          title="Marcar como lida"
                        >
                          <FiEye size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-red-500 hover:text-red-400 transition"
                        title="Excluir"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhuma notificação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-gray800">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray800 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray800 rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
