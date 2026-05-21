import { useState, useEffect } from 'react';
import { getPendingAdmins, approveAdmin, rejectAdmin } from '../../services/admin';
import { FiCheck, FiX, FiUserPlus } from 'react-icons/fi';

interface PendingAdmin {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function PendingAdmins() {
  const [pending, setPending] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const data = await getPendingAdmins();
      setPending(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: string) => {
    await approveAdmin(id);
    fetchPending();
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    await rejectAdmin(id, reason || undefined);
    fetchPending();
  };

  if (loading) return <div className="p-6 text-center">Carregando solicitações...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6 flex items-center gap-2"><FiUserPlus /> Solicitações de Cadastro de Administradores</h1>
      {pending.length === 0 ? (
        <div className="bg-gray900 p-8 rounded-lg text-center text-gray-500">Nenhuma solicitação pendente.</div>
      ) : (
        <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray800"><tr className="text-gray-400"><th className="p-4 text-left">Nome</th><th className="p-4 text-left">Email</th><th className="p-4 text-left">Data</th><th className="p-4 text-left">Ações</th></tr></thead>
            <tbody>
              {pending.map(admin => (
                <tr key={admin.id} className="border-t border-gray800">
                  <td className="p-4 text-white">{admin.name}</td>
                  <td className="p-4 text-gray-300">{admin.email}</td>
                  <td className="p-4 text-gray-300">{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(admin.id)} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"><FiCheck size={16} /> Aprovar</button>
                      <button onClick={() => handleReject(admin.id)} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-red-700"><FiX size={16} /> Rejeitar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}