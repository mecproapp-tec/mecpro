import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/admin/users");
        setUsers(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao carregar usuários");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleBlock = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await api.put(`/admin/users/${id}/block`);
      setUsers(users.map(u => u.id === id ? { ...u, status: "BLOCKED" } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao bloquear");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/activate`);
      setUsers(users.map(u => u.id === id ? { ...u, status: "ACTIVE" } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao ativar");
    }
  };

  if (loading) return <div className="p-6 text-center">Carregando...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6">Usuários</h1>
      <div className="bg-gray900 rounded-lg border border-gray800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray800">
            <tr className="text-gray-400">
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Função</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Criado em</th>
              <th className="text-left p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray800">
                <td className="p-4 text-white">{user.name}</td>
                <td className="p-4 text-gray-300">{user.email}</td>
                <td className="p-4 text-gray-300">{user.role}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.status === "ACTIVE" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <Link to={`/users/${user.id}`} className="text-neonBlue hover:underline mr-2">Ver</Link>
                  {user.status === "ACTIVE" ? (
                    <button onClick={() => handleBlock(user.id)} className="text-red-500 hover:underline">Bloquear</button>
                  ) : (
                    <button onClick={() => handleActivate(user.id)} className="text-green-500 hover:underline">Ativar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}