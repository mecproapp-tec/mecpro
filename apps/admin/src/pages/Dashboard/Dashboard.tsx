import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, DashboardData } from '../../services/admin';
import { FiUsers, FiFileText, FiDollarSign, FiUserCheck, FiUserX } from 'react-icons/fi';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const result = await getDashboard();
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  const cards = [
    { icon: <FiUsers />, label: 'Total Tenants', value: data?.totalTenants ?? 0, link: '/tenants' },
    { icon: <FiUserCheck />, label: 'Ativos', value: data?.activeTenants ?? 0, link: '/tenants?status=ACTIVE' },
    { icon: <FiUserX />, label: 'Bloqueados', value: data?.blockedTenants ?? 0, link: '/tenants?status=BLOCKED' },
    { icon: <FiUsers />, label: 'Total Clientes', value: data?.totalClients ?? 0, link: '/clients' },
    { icon: <FiFileText />, label: 'Orçamentos', value: data?.totalEstimates ?? 0, link: '/estimates' },
    { icon: <FiDollarSign />, label: 'Faturas', value: data?.totalInvoices ?? 0, link: '/invoices' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className="bg-gray900 p-6 rounded-lg border border-gray800 hover:border-neonBlue transition block"
          >
            <div className="text-neonBlue text-3xl mb-2">{card.icon}</div>
            <h3 className="text-gray-400 text-sm">{card.label}</h3>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-semibold text-white mt-8 mb-4">Últimos Tenants</h2>
      <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray800">
            <tr className="text-gray-400">
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Criado em</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Ações</th>
             </tr>
          </thead>
          <tbody>
            {data?.recentTenants.map((tenant) => (
              <tr key={tenant.id} className="border-t border-gray800">
                <td className="p-4 text-white">{tenant.name}</td>
                <td className="p-4 text-gray-300">{tenant.email}</td>
                <td className="p-4 text-gray-300">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tenant.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="p-4">
                  <Link to={`/tenants/${tenant.id}`} className="text-neonBlue hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}