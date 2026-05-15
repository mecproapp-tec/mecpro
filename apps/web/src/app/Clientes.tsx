import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiTrash2, FiCalendar, FiPlus } from "react-icons/fi";

interface Cliente {
  id: string;
  nome: string;
  telefone1: string;
  telefone2?: string;
  veiculo: string;
  modelo: string;
  placa: string;
}

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    // Simular carregamento de clientes do localStorage ou API
    const stored = localStorage.getItem("clientes");
    if (stored) {
      setClientes(JSON.parse(stored));
    } else {
      // Dados iniciais para teste
      const mock = [
        { id: "1", nome: "João Silva", telefone1: "11999999999", veiculo: "Fiat Uno", modelo: "2010", placa: "ABC1234" },
        { id: "2", nome: "Maria Souza", telefone1: "11888888888", telefone2: "11777777777", veiculo: "Honda Civic", modelo: "2015", placa: "XYZ5678" },
      ];
      setClientes(mock);
      localStorage.setItem("clientes", JSON.stringify(mock));
    }
  }, []);

  const handleExcluir = (id: string) => {
    const novos = clientes.filter(c => c.id !== id);
    setClientes(novos);
    localStorage.setItem("clientes", JSON.stringify(novos));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-neonBlue">Clientes</h1>
          <button
            onClick={() => navigate("/clientes/novo")}
            className="bg-neonBlue text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-cyan-300 transition"
          >
            <FiPlus /> Novo Cliente
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Veículo</th>
                <th className="p-3">Placa</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <tr key={cliente.id} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="p-3">{cliente.nome}</td>
                  <td className="p-3">{cliente.veiculo} {cliente.modelo}</td>
                  <td className="p-3">{cliente.placa}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => navigate(`/clientes/editar/${cliente.id}`)} className="text-neonBlue hover:text-cyan-300">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleExcluir(cliente.id)} className="text-red-400 hover:text-red-300">
                      <FiTrash2 />
                    </button>
                    <button onClick={() => navigate(`/agendamento/${cliente.id}`)} className="text-green-400 hover:text-green-300">
                      <FiCalendar />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}