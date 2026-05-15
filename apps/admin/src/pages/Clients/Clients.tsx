import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAllClients, blockClient, activateClient, Client } from '../../services/admin';
import { FiSearch, FiEye, FiLock, FiUnlock, FiMessageSquare } from 'react-icons/fi';
import SendMessageModal from '../../components/SendMessageModal';

export default function Clients() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId') || undefined;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalClient, setModalClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getAllClients({ search, tenantId });
      setClients(data);
    } catch (error) {
      console.error('Erro ao carregar clientes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, tenantId]);

  const handleBlock = async (id: string) => {
    if (!confirm('Bloquear este cliente? Ele não poderá criar novos orçamentos/faturas.')) return;
    try {
      await blockClient(id);
      fetchClients();
    } catch (error) {
      alert('Erro ao bloquear cliente');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateClient(id);
      fetchClients();
    } catch (error) {
      alert('Erro ao ativar cliente');
    }
  };

  if (loading) return <div className="p-6 text-center">Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6">
        {tenantId ? 'Clientes do Tenant' : 'Todos os Clientes'}
      </h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, veículo ou placa"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray800 border border-gray700 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray800">
            <tr className="text-gray-400">
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">Telefone</th>
              <th className="p-4 text-left">Veículo</th>
              <th className="p-4 text-left">Placa</th>
              <th className="p-4 text-left">Tenant</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-gray800">
                <td className="p-4 text-white">{client.name}</td>
                <td className="p-4 text-gray-300">{client.phone}</td>
                <td className="p-4 text-gray-300">{client.vehicle}</td>
                <td className="p-4 text-gray-300">{client.plate}</td>
                <td className="p-4 text-gray-300">
                  <Link to={`/tenants/${client.tenantId}`} className="text-neonBlue hover:underline">
                    {client.tenantName || 'Ver tenant'}
                  </Link>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    client.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {client.status === 'ACTIVE' ? 'Ativo' : 'Bloqueado'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Link to={`/clients/${client.id}`} className="text-neonBlue">
                      <FiEye size={18} />
                    </Link>
                    {client.status === 'ACTIVE' ? (
                      <button onClick={() => handleBlock(client.id)} className="text-red-500">
                        <FiLock size={18} />
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(client.id)} className="text-green-500">
                        <FiUnlock size={18} />
                      </button>
                    )}
                    <button onClick={() => setModalClient(client)} className="text-neonBlue">
                      <FiMessageSquare size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalClient && (
        <SendMessageModal
          clientId={modalClient.id}
          clientName={modalClient.name}
          onClose={() => setModalClient(null)}
          onSent={fetchClients}
        />
      )}
    </div>
  );
}