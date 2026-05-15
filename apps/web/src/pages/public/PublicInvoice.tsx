import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { FiCopy, FiDownload, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface InvoiceData {
  id: number;
  number: string;
  total: number;
  status: string;
  createdAt: string;
  client: {
    name: string;
    phone: string;
    vehicle: string;
    plate: string;
    address: string;
    document: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
    issPercent: number;
  }>;
  tenant: {
    name: string;
    documentNumber: string;
    phone: string;
    email: string;
    logoUrl: string;
  };
  pdfUrl: string;
}

export default function PublicInvoice() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/public/invoices/share/${token}`);
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.message || 'Link inválido');
        }
      } catch (err: any) {
        console.error('Erro ao buscar fatura:', err);
        setError(err.response?.data?.message || 'Link inválido ou expirado');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado!');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paga' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      CANCELED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
    };
    const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Link inválido</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-green-600 text-white p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {data.tenant.logoUrl && (
              <img src={data.tenant.logoUrl} alt="Logo" className="h-12 w-auto bg-white rounded p-1" />
            )}
            <div>
              <h1 className="text-2xl font-bold">Fatura {data.number}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(data.status)}
                <span className="text-sm opacity-90">• {new Date(data.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-sm opacity-90 mt-1">{data.tenant.name} • {data.tenant.documentNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition" title="Copiar link">
              <FiCopy size={20} />
            </button>
            {data.pdfUrl && (
              <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition" title="Baixar PDF">
                <FiDownload size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Cliente</h2>
              <p><strong>Nome:</strong> {data.client.name}</p>
              <p><strong>Telefone:</strong> {data.client.phone}</p>
              <p><strong>Veículo:</strong> {data.client.vehicle}</p>
              <p><strong>Placa:</strong> {data.client.plate}</p>
              <p><strong>Endereço:</strong> {data.client.address || '-'}</p>
              <p><strong>Documento:</strong> {data.client.document || '-'}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Oficina</h2>
              <p><strong>{data.tenant.name}</strong></p>
              <p>{data.tenant.documentNumber}</p>
              <p>Tel: {data.tenant.phone}</p>
              <p>Email: {data.tenant.email}</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Itens</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border">Descrição</th>
                  <th className="py-2 px-4 border">Qtd</th>
                  <th className="py-2 px-4 border">Preço</th>
                  <th className="py-2 px-4 border">ISS</th>
                  <th className="py-2 px-4 border">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items && data.items.length > 0 ? (
                  data.items.map((item, idx) => {
                    const itemTotal = (item.price ?? 0) * (item.quantity ?? 0);
                    const iss = itemTotal * ((item.issPercent ?? 0) / 100);
                    const totalComIss = itemTotal + iss;
                    return (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4">{item.description}</td>
                        <td className="py-2 px-4 text-center">{item.quantity}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-2 px-4 text-center">{item.issPercent}%</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(totalComIss)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4">Nenhum item encontrado.</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan={4} className="py-2 px-4 text-right">TOTAL</td>
                  <td className="py-2 px-4 text-right">{formatCurrency(data.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {data.pdfUrl && (
            <div className="mt-6 text-center">
              <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition">
                <FiExternalLink /> Visualizar PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}