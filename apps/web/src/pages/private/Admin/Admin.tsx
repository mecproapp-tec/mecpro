import { useState, useEffect } from "react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  tenantId?: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // 🔥 BUG #61 CORRIGIDO: Buscar dados reais do backend
        const response = await api.get("/users");
        setUsers(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Erro ao carregar usuários:", err);
        setError(err.response?.data?.message || "Erro ao carregar usuários");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-400">Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-neonBlue mb-4">Administração</h1>
      <div className="overflow-x-auto bg-gray-800 p-4 rounded-2xl shadow-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="py-2 px-4">ID</th>
              <th className="py-2 px-4">Nome</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Função</th>
              <th className="py-2 px-4">Oficina</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                  <td className="py-2 px-4">{u.id}</td>
                  <td className="py-2 px-4">{u.name}</td>
                  <td className="py-2 px-4">{u.email}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-500' :
                      u.role === 'ADMIN' ? 'bg-blue-500' : 'bg-green-500'
                    } text-white`}>
                      {u.role || 'USER'}
                    </span>
                  </td>
                  <td className="py-2 px-4">{u.tenantId || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}