import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAllEstimates, Estimate } from '../../services/admin';
import { FiEye } from 'react-icons/fi';
import api from '../../services/api';

const statusMap: Record<string, string> = {
  DRAFT: 'Pendente',
  APPROVED: 'Aceito',
  CONVERTED: 'Convertido',
};

function getStatusLabel(status: string): string {
  return statusMap[status] || status;
}

export default function Estimates() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId') || undefined;
  const statusFilter = searchParams.get('status') || undefined;
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstimates = async () => {
      setLoading(true);
      try {
        const data = await getAllEstimates({ status: statusFilter, tenantId });
        setEstimates(data);
      } catch (error) {
        console.error('Erro ao carregar orçamentos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEstimates();
  }, [statusFilter, tenantId]);

  const abrirPDF = async (id: number) => {
    try {
      const response = await api.get(`/admin/estimates/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Tente novamente.');
    }
  };

  if (loading) return <div className="p-6 text-center">Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6">
        {tenantId ? 'Orçamentos do Tenant' : 'Todos os Orçamentos'}
      </h1>

      <div className="flex gap-4 mb-6">
        <Link to="/estimates" className="px-4 py-2 bg-gray800 rounded-lg text-white hover:bg-gray700">
          Todos
        </Link>
        <Link to="/estimates?status=DRAFT" className="px-4 py-2 bg-gray800 rounded-lg text-white hover:bg-gray700">
          Pendentes
        </Link>
        <Link to="/estimates?status=APPROVED" className="px-4 py-2 bg-gray800 rounded-lg text-white hover:bg-gray700">
          Aceitos
        </Link>
        <Link to="/estimates?status=CONVERTED" className="px-4 py-2 bg-gray800 rounded-lg text-white hover:bg-gray700">
          Convertidos
        </Link>
      </div>

      <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray800">
            <tr className="text-gray-400">
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Data</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Tenant</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map((est) => (
              <tr key={est.id} className="border-t border-gray800">
                <td className="p-4 text-white">{est.id}</td>
                <td className="p-4 text-gray-300">
                  <Link to={`/clients/${est.clientId}`} className="text-neonBlue hover:underline">
                    {est.clientName || 'Cliente'}
                  </Link>
                </td>
                <td className="p-4 text-gray-300">{new Date(est.date).toLocaleDateString()}</td>
                <td className="p-4 text-right text-gray-300">R$ {Number(est.total).toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    est.status === 'APPROVED' ? 'bg-green-900 text-green-300' :
                    est.status === 'DRAFT' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'
                  }`}>
                    {getStatusLabel(est.status)}
                  </span>
                </td>
                <td className="p-4 text-gray-300">
                  <Link to={`/tenants/${est.tenantId}`} className="text-neonBlue hover:underline">
                    {est.tenantName || 'Ver tenant'}
                  </Link>
                </td>
                <td className="p-4">
                  <button onClick={() => abrirPDF(Number(est.id))} className="text-neonBlue hover:underline inline-flex items-center gap-1">
                    <FiEye size={16} /> Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}