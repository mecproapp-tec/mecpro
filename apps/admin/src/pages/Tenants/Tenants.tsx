// apps/admin/src/pages/Tenants/Tenants.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTenants, updateTenantStatus, deleteTenant, invalidateTenantsCache, Tenant } from '../../services/admin';
import { FiEye, FiTrash2 } from 'react-icons/fi';

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const data = await getTenants({ status: statusFilter });
      setTenants(data);
    } catch (error) {
      console.error('Erro ao carregar tenants', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateTenantStatus(id, newStatus);
      // Invalida o cache para garantir dados atualizados na próxima consulta
      invalidateTenantsCache({ status: statusFilter });
      await fetchTenants();
    } catch (error) {
      alert('Erro ao alterar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tenant? Todos os dados relacionados serão perdidos.')) return;
    try {
      await deleteTenant(id);
      // Invalida o cache após exclusão
      invalidateTenantsCache({ status: statusFilter });
      await fetchTenants();
    } catch (error) {
      alert('Erro ao excluir tenant');
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6">Gerenciar Tenants</h1>
      <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray800">
            <tr className="text-gray-400">
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Documento</th>
              <th className="p-4 text-left">Telefone</th>
              <th className="p-4 text-left">Clientes</th>
              <th className="p-4 text-left">Orçamentos</th>
              <th className="p-4 text-left">Faturas</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t border-gray800">
                <td className="p-4 text-white">{tenant.name}</td>
                <td className="p-4 text-gray-300">{tenant.email}</td>
                <td className="p-4 text-gray-300">{tenant.documentNumber}</td>
                <td className="p-4 text-gray-300">{tenant.phone}</td>
                <td className="p-4 text-gray-300">{tenant._count?.clients ?? 0}</td>
                <td className="p-4 text-gray-300">{tenant._count?.estimates ?? 0}</td>
                <td className="p-4 text-gray-300">{tenant._count?.invoices ?? 0}</td>
                <td className="p-4">
                  <select
                    value={tenant.status}
                    onChange={(e) => handleStatusChange(tenant.id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      tenant.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="BLOCKED">Bloqueado</option>
                    <option value="CANCELED">Cancelado</option>
                  </select>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Link to={`/tenants/${tenant.id}`} className="text-neonBlue hover:text-white">
                      <FiEye size={18} />
                    </Link>
                    <button onClick={() => handleDelete(tenant.id)} className="text-red-500 hover:text-red-400">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}