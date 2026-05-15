import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiMessageSquare,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiX,
} from 'react-icons/fi';

interface ContactMessage {
  id: number;
  userName: string | null;
  userEmail: string | null;
  message: string;
  reply: string | null;
  status: 'pending' | 'replied' | 'archived';
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/admin/contact');
      setMessages(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    setSending(true);
    try {
      await api.put(`/admin/contact/${replyingTo.id}/reply`, { reply: replyText });
      setReplyingTo(null);
      setReplyText('');
      fetchMessages();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao enviar resposta');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta mensagem permanentemente?')) return;
    try {
      await api.delete(`/admin/contact/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir');
    }
  };

  const filtered = messages.filter(msg => {
    if (statusFilter !== 'all' && msg.status !== statusFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        (msg.userName && msg.userName.toLowerCase().includes(searchLower)) ||
        (msg.userEmail && msg.userEmail.toLowerCase().includes(searchLower)) ||
        msg.message.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-900 text-yellow-300"><FiMail size={12} /> Pendente</span>;
      case 'replied':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300"><FiCheckCircle size={12} /> Respondida</span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-300"><FiXCircle size={12} /> Arquivada</span>;
      default:
        return null;
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando mensagens...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6">Mensagens de Contato</h1>

      <div className="bg-gray900 p-4 rounded-lg border border-gray800 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-gray-400 text-sm mb-1">Buscar</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Nome, e-mail ou mensagem"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray800 border border-gray700 rounded-lg text-white"
            />
          </div>
        </div>
        <div className="min-w-[150px]">
          <label className="block text-gray-400 text-sm mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="replied">Respondidas</option>
            <option value="archived">Arquivadas</option>
          </select>
        </div>
        <button
          onClick={() => {
            setSearch('');
            setStatusFilter('all');
          }}
          className="bg-gray700 text-white px-4 py-2 rounded-lg hover:bg-gray600 transition flex items-center gap-2"
        >
          <FiFilter /> Limpar
        </button>
      </div>

      <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray800">
              <tr className="text-gray-400">
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Usuário / Tenant</th>
                <th className="p-4 text-left">Mensagem</th>
                <th className="p-4 text-left">Data</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((msg) => (
                <tr key={msg.id} className="border-t border-gray800 hover:bg-gray800/50">
                  <td className="p-4 text-white font-mono">{msg.id}</td>
                  <td className="p-4">
                    <div className="text-white font-medium">{msg.userName || 'Anônimo'}</div>
                    <div className="text-sm text-gray-400">{msg.userEmail || '—'}</div>
                    {msg.tenant && (
                      <div className="text-xs text-neonBlue mt-1">
                        Tenant: {msg.tenant.name}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="max-w-md truncate" title={msg.message}>
                      {msg.message.length > 80 ? msg.message.substring(0, 80) + '…' : msg.message}
                    </div>
                    {msg.reply && (
                      <div className="mt-2 text-sm text-neonBlue border-l-2 border-neonBlue pl-2">
                        <span className="font-semibold">Resposta:</span> {msg.reply}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-gray-300 whitespace-nowrap">
                    {new Date(msg.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">{getStatusBadge(msg.status)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {msg.status === 'pending' && (
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="text-neonBlue hover:text-white transition"
                          title="Responder"
                        >
                          <FiMessageSquare size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(msg.id)}
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
                    Nenhuma mensagem encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

      {replyingTo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray900 rounded-xl border border-gray800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Responder Mensagem</h2>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray800 rounded-lg">
                <p className="text-gray-400 text-sm">Mensagem original:</p>
                <p className="text-white mt-1 whitespace-pre-wrap">{replyingTo.message}</p>
                <p className="text-gray-500 text-xs mt-2">
                  De: {replyingTo.userName || 'Anônimo'} ({replyingTo.userEmail || 'sem e-mail'})
                </p>
                {replyingTo.tenant && (
                  <p className="text-neonBlue text-xs mt-1">
                    Tenant: {replyingTo.tenant.name} ({replyingTo.tenant.email})
                  </p>
                )}
              </div>

              <label className="block text-gray-400 mb-2">Sua resposta</label>
              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-gray800 border border-gray700 rounded-lg px-4 py-2 text-white"
                placeholder="Digite sua resposta..."
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 bg-gray700 text-white rounded-lg hover:bg-gray600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2 bg-neonBlue text-black rounded-lg font-bold hover:bg-cyan-300 disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : 'Enviar Resposta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}