import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAllInvoices, Invoice } from '../../services/admin';
import { FiEye } from 'react-icons/fi';
import api from '../../services/api';

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId') || undefined;
  const statusFilter = searchParams.get('status') || undefined;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const data = await getAllInvoices({ status: statusFilter, tenantId });
        setInvoices(data);
      } catch (error) {
        console.error('Erro ao carregar faturas', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [statusFilter, tenantId]);

  const abrirPDF = async (id: number) => {
    try {
      const response = await api.get(`/admin/invoices/${id}/pdf`, {
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6">
        {tenantId ? 'Faturas do Tenant' : 'Todas as Faturas'}
      </h1>

      <div className="flex gap-4 mb-6">
        <Link
          to="/admin/invoices"
          className="px-4 py-2 bg-gray800 rounded-lg text-white hover:bg-gray700"
        >
          Todas
        </Link>
        <Link
          to="/admin/invoices?status=PENDING"
          className="px-4 py-2 bg-gray800 rounded-lg text-white hover:bg-gray700"
        >
          Pendentes
        </Link>
        <Link
          to="/admin/invoices?status=PAID"
          className="px-4 py-2 bg-gray800 rounded-lg text-white hover:bg-gray700"
        >
          Pagas
        </Link>
        <Link
          to="/admin/invoices?status=CANCELED"
          className="px-4 py-2 bg-gray800 rounded-lg text-white hover:bg-gray700"
        >
          Canceladas
        </Link>
      </div>

      <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray800">
            <tr className="text-gray-400">
              <th className="p-4 text-left">Nº</th>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Data</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Tenant</th>
              <th className="p-4 text-left">Ações</th>
             </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-gray800">
                <td className="p-4 text-white">{inv.number}</td>
                <td className="p-4 text-gray-300">
                  <Link
                    to={`/admin/clients/${inv.clientId}`}
                    className="text-neonBlue hover:underline"
                  >
                    {inv.clientName || 'Cliente'}
                  </Link>
                </td>
                <td className="p-4 text-gray-300">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right text-gray-300">
                  R$ {inv.total.toFixed(2)}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      inv.status === 'PAID'
                        ? 'bg-green-900 text-green-300'
                        : inv.status === 'PENDING'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {inv.status === 'PAID'
                      ? 'Paga'
                      : inv.status === 'PENDING'
                      ? 'Pendente'
                      : 'Cancelada'}
                  </span>
                </td>
                <td className="p-4 text-gray-300">
                  <Link
                    to={`/admin/tenants/${inv.tenantId}`}
                    className="text-neonBlue hover:underline"
                  >
                    {inv.tenantName || 'Ver tenant'}
                  </Link>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => abrirPDF(inv.id)}
                    className="text-neonBlue hover:underline inline-flex items-center gap-1"
                  >
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
