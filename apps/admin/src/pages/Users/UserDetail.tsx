import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // outros campos específicos
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/admin/users/${id}`);
        setUser(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao carregar usuário");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <div className="p-6 text-center">Carregando...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!user) return null;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/users")}
        className="text-neonBlue hover:underline mb-4 inline-block"
      >
        ← Voltar
      </button>
      <h1 className="text-2xl font-bold text-neonBlue mb-6">Detalhes do Usuário</h1>
      <div className="bg-gray900 p-6 rounded-lg border border-gray800">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Nome</p>
            <p className="text-white font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Email</p>
            <p className="text-white">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Função</p>
            <p className="text-white">{user.role}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Status</p>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                user.status === "ACTIVE"
                  ? "bg-green-900 text-green-300"
                  : "bg-red-900 text-red-300"
              }`}
            >
              {user.status}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Criado em</p>
            <p className="text-white">{new Date(user.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Atualizado em</p>
            <p className="text-white">{new Date(user.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
