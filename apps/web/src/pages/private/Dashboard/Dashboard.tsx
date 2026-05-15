import { useEffect, useState } from "react";
import api from "../../../services/api";

interface DashboardStats {
  clients: number;
  estimates: number;
  invoices: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    clients: 0,
    estimates: 0,
    invoices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response = await api.get("/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-400">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-neonBlue">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray800 p-6 rounded-2xl shadow-lg text-center">
          <h2 className="text-gray-400">Clientes</h2>
          <p className="text-neonGreen text-3xl font-bold">{stats.clients}</p>
        </div>
        <div className="bg-gray800 p-6 rounded-2xl shadow-lg text-center">
          <h2 className="text-gray-400">Orçamentos</h2>
          <p className="text-neonBlue text-3xl font-bold">{stats.estimates}</p>
        </div>
        <div className="bg-gray800 p-6 rounded-2xl shadow-lg text-center">
          <h2 className="text-gray-400">Faturas</h2>
          <p className="text-neonGreen text-3xl font-bold">{stats.invoices}</p>
        </div>
      </div>
    </div>
  );
}