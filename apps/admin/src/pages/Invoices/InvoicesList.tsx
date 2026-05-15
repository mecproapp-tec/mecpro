import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiFilter } from 'react-icons/fi';

interface Invoice {
  id: number;
  number: string;
  total: number;
  status: string;
  createdAt: string;
  clientName: string;
  tenantName: string;
}

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantFilter, setTenantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await api.get('/admin/tenants');
        setTenants(res.data.map((t: any) => ({ id: t.id, name: t.name })));
      } catch (error) {
        console.error('Erro ao carregar tenants', error);
      }
    };
    fetchTenants();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tenantFilter) params.append('tenantId', tenantFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const res = await api.get(`/admin/invoices?${params.toString()}`);
        setInvoices(res.data);
      } catch (error) {
        console.error('Erro ao carregar faturas', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [tenantFilter, statusFilter, startDate, endDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-900 text-green-300';
      case 'PENDING': return 'bg-yellow-900 text-yellow-300';
      case 'CANCELED': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

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
      <h1 className="text-2xl font-bold text-neonBlue mb-6">Todas as Faturas</h1>

      {/* Filtros */}
      <div className="bg-gray900 p-4 rounded-lg border border-gray800 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-gray-400 text-sm mb-1">Tenant</label>
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Todos</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-gray-400 text-sm mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Paga</option>
            <option value="CANCELED">Cancelada</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-gray-400 text-sm mb-1">Data inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-gray-400 text-sm mb-1">Data final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <button
          onClick={() => {
            setTenantFilter('');
            setStatusFilter('');
            setStartDate('');
            setEndDate('');
          }}
          className="bg-gray700 text-white px-4 py-2 rounded-lg hover:bg-gray600 transition flex items-center gap-2"
        >
          <FiFilter /> Limpar
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-10">Carregando...</div>
      ) : (
        <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray800">
              <tr className="text-gray-400">
                <th className="p-4 text-left">Número</th>
                <th className="p-4 text-left">Tenant</th>
                <th className="p-4 text-left">Cliente</th>
                <th className="p-4 text-left">Data</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-gray-500">Nenhuma fatura encontrada</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-gray800">
                    <td className="p-4 text-white">{inv.number}</td>
                    <td className="p-4 text-gray-300">{inv.tenantName}</td>
                    <td className="p-4 text-gray-300">{inv.clientName}</td>
                    <td className="p-4 text-gray-300">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right text-gray-300">R$ {inv.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => abrirPDF(inv.id)}
                        className="text-neonBlue hover:underline"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
