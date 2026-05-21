import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTenant, getTenantTotals } from '../../services/admin';
import { FiArrowLeft, FiMail, FiPhone, FiFileText, FiCalendar, FiMapPin, FiHome, FiImage } from 'react-icons/fi';

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'estimates' | 'invoices'>('clients');

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const data = await getTenant(id!);
        setTenant(data);
        const totalsData = await getTenantTotals(id!);
        setTotals(totalsData);
      } catch (error) {
        console.error('Erro ao carregar tenant', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!tenant) return <div className="p-8 text-center">Tenant não encontrado</div>;

  return (
    <div className="p-6">
      <button onClick={() => navigate('/tenants')} className="text-neonBlue hover:underline mb-4 inline-flex items-center gap-2">
        <FiArrowLeft /> Voltar
      </button>

      <div className="bg-gray900 rounded-lg border border-gray800 p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-neonBlue" />
            ) : (
              <div className="w-16 h-16 bg-gray800 rounded-full flex items-center justify-center">
                <FiImage className="text-gray-500" size={32} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-neonBlue">{tenant.name}</h1>
              <p className="text-gray-400 text-sm">ID: {tenant.id}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            tenant.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {tenant.status === 'ACTIVE' ? 'Ativo' : 'Bloqueado'}
          </span>
        </div>

        {totals && (
          <div className="mt-6 mb-6 grid grid-cols-3 gap-4 p-4 bg-gray800 rounded-lg">
            <div><p className="text-gray-400">Clientes</p><p className="text-2xl font-bold">{totals.clients}</p></div>
            <div><p className="text-gray-400">Orçamentos</p><p className="text-2xl font-bold">{totals.estimates}</p><p className="text-sm">R$ {Number(totals.estimatesTotal).toFixed(2)}</p></div>
            <div><p className="text-gray-400">Faturas</p><p className="text-2xl font-bold">{totals.invoices}</p><p className="text-sm">R$ {Number(totals.invoicesTotal).toFixed(2)}</p></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3"><FiMail className="text-gray-400" /><div><p className="text-gray-400 text-sm">Email</p><p className="text-white">{tenant.email}</p></div></div>
            <div className="flex items-center gap-3"><FiPhone className="text-gray-400" /><div><p className="text-gray-400 text-sm">Telefone</p><p className="text-white">{tenant.phone}</p></div></div>
            <div className="flex items-center gap-3"><FiFileText className="text-gray-400" /><div><p className="text-gray-400 text-sm">Documento</p><p className="text-white">{tenant.documentNumber} ({tenant.documentType || 'CNPJ/CPF'})</p></div></div>
            <div className="flex items-center gap-3"><FiCalendar className="text-gray-400" /><div><p className="text-gray-400 text-sm">Cadastro</p><p className="text-white">{new Date(tenant.createdAt).toLocaleDateString()}</p></div></div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><FiMapPin className="text-gray-400" /><div><p className="text-gray-400 text-sm">Endereço</p><p className="text-white">{tenant.address || 'Não informado'}</p></div></div>
            <div className="flex items-center gap-3"><FiHome className="text-gray-400" /><div><p className="text-gray-400 text-sm">CEP</p><p className="text-white">{tenant.cep || 'Não informado'}</p></div></div>
            {tenant.trialEndsAt && (<div className="flex items-center gap-3"><FiCalendar className="text-gray-400" /><div><p className="text-gray-400 text-sm">Período de teste termina</p><p className="text-white">{new Date(tenant.trialEndsAt).toLocaleDateString()}</p></div></div>)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray800">
        {[
          { key: 'clients', label: 'Clientes', count: tenant.clients?.length || 0 },
          { key: 'estimates', label: 'Orçamentos', count: tenant.estimates?.length || 0 },
          { key: 'invoices', label: 'Faturas', count: tenant.invoices?.length || 0 },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
            activeTab === tab.key ? 'bg-neonBlue text-black' : 'text-gray-400 hover:text-white'
          }`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeTab === 'clients' && <ClientsList clients={tenant.clients || []} />}
      {activeTab === 'estimates' && <EstimatesList estimates={tenant.estimates || []} />}
      {activeTab === 'invoices' && <InvoicesList invoices={tenant.invoices || []} />}
    </div>
  );
}

function ClientsList({ clients }: { clients: any[] }) {
  if (clients.length === 0) return <div className="text-center text-gray-500 py-8">Nenhum cliente encontrado</div>;
  return (
    <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
      <table className="w-full"><thead className="bg-gray800"><tr className="text-gray-400"><th className="p-3 text-left">Nome</th><th className="p-3 text-left">Telefone</th><th className="p-3 text-left">Veículo</th><th className="p-3 text-left">Placa</th></tr></thead>
      <tbody>{clients.map((client) => (<tr key={client.id} className="border-t border-gray800"><td className="p-3 text-white">{client.name}</td><td className="p-3 text-gray-300">{client.phone}</td><td className="p-3 text-gray-300">{client.vehicle}</td><td className="p-3 text-gray-300">{client.plate}</td></tr>))}</tbody></table>
    </div>
  );
}

function EstimatesList({ estimates }: { estimates: any[] }) {
  if (estimates.length === 0) return <div className="text-center text-gray-500 py-8">Nenhum orçamento encontrado</div>;
  return (
    <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
      <table className="w-full"><thead className="bg-gray800"><tr className="text-gray-400"><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Data</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Status</th></tr></thead>
      <tbody>{estimates.map((est) => (<tr key={est.id} className="border-t border-gray800"><td className="p-3 text-white">{est.client?.name || 'N/A'}</td><td className="p-3 text-gray-300">{new Date(est.date).toLocaleDateString()}</td><td className="p-3 text-right text-gray-300">R$ {!isNaN(est.total) ? est.total.toFixed(2) : '0,00'}</td><td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-gray700 text-white">{est.status}</span></td></tr>))}</tbody></table>
    </div>
  );
}

function InvoicesList({ invoices }: { invoices: any[] }) {
  if (invoices.length === 0) return <div className="text-center text-gray-500 py-8">Nenhuma fatura encontrada</div>;
  return (
    <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
      <table className="w-full"><thead className="bg-gray800"><tr className="text-gray-400"><th className="p-3 text-left">Número</th><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Data</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Status</th></tr></thead>
      <tbody>{invoices.map((inv) => (<tr key={inv.id} className="border-t border-gray800"><td className="p-3 text-white">{inv.number}</td><td className="p-3 text-gray-300">{inv.client?.name || 'N/A'}</td><td className="p-3 text-gray-300">{new Date(inv.createdAt).toLocaleDateString()}</td><td className="p-3 text-right text-gray-300">R$ {!isNaN(inv.total) ? inv.total.toFixed(2) : '0,00'}</td><td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-gray700 text-white">{inv.status}</span></td></tr>))}</tbody></table>
    </div>
  );
}