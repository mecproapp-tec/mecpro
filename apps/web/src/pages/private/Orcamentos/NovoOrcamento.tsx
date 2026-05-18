import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiPlus, FiX, FiArrowLeft } from "react-icons/fi";
import { getClients, type Client } from "../../../services/clients";
import {
  getEstimateById,
  createEstimate,
  updateEstimate,
} from "../../../services/Estimates";
import type { EstimateItem } from "../../../services/Estimates";

interface CreateEstimateData {
  clientId: number;
  date: string;
  items: {
    description: string;
    quantity: number;
    price: number;
    issPercent?: number;
  };
  paymentMethod?: string;
}

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [clientes, setClientes] = useState<Client[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Client | null>(null);
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<Omit<EstimateItem, "total">[]>([
    { description: "", quantity: 1, price: 0, issPercent: undefined },
  ]);
  const [dataOrcamento, setDataOrcamento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    if (isEditing && clientes.length > 0) {
      carregarOrcamento();
    }
  }, [id, clientes.length]);

  const carregarClientes = async () => {
    try {
      const data = await getClients();
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar clientes", err);
    }
  };

  const carregarOrcamento = async () => {
    try {
      const orcamento = await getEstimateById(Number(id));
      const cliente = clientes.find((c) => c.id === orcamento.clientId);
      setClienteSelecionado(cliente || null);
      setItens(
        orcamento.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity ?? 1,
          price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
          issPercent: item.issPercent !== undefined && item.issPercent !== null ? Number(item.issPercent) : undefined,
        }))
      );
      setDataOrcamento(
        orcamento.date?.split("T")[0] || new Date().toISOString().split("T")[0]
      );
      setPaymentMethod(orcamento.paymentMethod || "");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar orçamento");
    }
  };

  const handleAddItem = () => {
    setItens([...itens, { description: "", quantity: 1, price: 0, issPercent: undefined }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof Omit<EstimateItem, "total">,
    value: string | number
  ) => {
    const novos = [...itens];
    if (field === "quantity" || field === "price") {
      const numValue = value === "" ? 0 : Number(value);
      novos[index][field] = isNaN(numValue) ? 0 : numValue;
    } else if (field === "issPercent") {
      const numValue = value === "" || value === undefined ? undefined : Number(value);
      novos[index].issPercent = numValue;
    } else {
      novos[index][field] = value as string;
    }
    setItens(novos);
  };

  const calcularTotalItem = (item: typeof itens[0]) => {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    const subtotal = price * quantity;
    const iss = item.issPercent ? subtotal * (item.issPercent / 100) : 0;
    return subtotal + iss;
  };

  const totalGeral = itens.reduce((acc, item) => acc + calcularTotalItem(item), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionado) {
      setError("Selecione um cliente");
      return;
    }

    const invalidItems = itens.filter(item => !item.description.trim());
    if (invalidItems.length > 0) {
      setError("Todos os itens devem ter uma descrição.");
      return;
    }

    if (itens.length === 0 || itens.every(i => i.price <= 0)) {
      setError("Adicione pelo menos um item válido (preço maior que zero)");
      return;
    }

    setLoading(true);
    setError("");

    const payload: CreateEstimateData = {
      clientId: clienteSelecionado.id,
      date: dataOrcamento,
      items: itens.map(({ description, quantity, price, issPercent }) => ({
        description: description.trim(),
        quantity: quantity || 1,
        price: typeof price === 'string' ? parseFloat(price) : price,
        issPercent: issPercent ? Number(issPercent) : 0,
      })),
      paymentMethod: paymentMethod || undefined,
    };

    try {
      if (isEditing) {
        await updateEstimate(Number(id), payload);
      } else {
        await createEstimate(payload);
      }
      navigate("/orcamentos");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Erro ao salvar orçamento");
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.name.toLowerCase().includes(busca.toLowerCase()) ||
      (c.plate && c.plate.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
        minHeight: "100vh",
        padding: "48px 24px",
        color: "#e0e0e0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "40px" }}>
          <button
            onClick={() => navigate("/orcamentos")}
            style={{
              background: "#1a1a1a",
              border: "none",
              color: "#00e5ff",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "24px",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0, 229, 255, 0.2)",
              marginRight: "16px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
          >
            <FiArrowLeft />
          </button>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: "700",
              background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
          </h1>
        </div>

        <div
          style={{
            background: "#111",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
          }}
        >
          {error && (
            <div
              style={{
                background: "#ff444420",
                border: "1px solid #ff4444",
                color: "#ff8888",
                padding: "12px 16px",
                borderRadius: "12px",
                marginBottom: "24px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#a0a0a0" }}>
                Cliente (nome ou placa)
              </label>
              {!isEditing && (
                <>
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Digite para buscar..."
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#333")}
                  />
                  {busca && clientesFiltrados.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        background: "#222",
                        borderRadius: "16px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        border: "1px solid #00e5ff30",
                      }}
                    >
                      {clientesFiltrados.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setClienteSelecionado(c);
                            setBusca("");
                          }}
                          style={{
                            padding: "14px 16px",
                            cursor: "pointer",
                            borderBottom: "1px solid #333",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {c.name} - {c.plate || "Sem placa"}
                        </div>
                      ))}
                    </div>
                  )}
                  {busca && clientesFiltrados.length === 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "14px 16px",
                        background: "#222",
                        borderRadius: "16px",
                        color: "#888",
                        textAlign: "center",
                      }}
                    >
                      Nenhum cliente encontrado
                    </div>
                  )}
                </>
              )}
              {clienteSelecionado && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "16px",
                    background: "#1a1a1a",
                    borderRadius: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid #00e5ff30",
                  }}
                >
                  <span style={{ fontSize: "16px", color: "#fff" }}>
                    {clienteSelecionado.name} - {clienteSelecionado.plate || "Sem placa"}
                  </span>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setClienteSelecionado(null)}
                      style={{
                        color: "#ff5555",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                      }}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#a0a0a0" }}>
                Data do Orçamento
              </label>
              <input
                type="date"
                value={dataOrcamento}
                onChange={(e) => setDataOrcamento(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00e5ff")}
                onBlur={(e) => (e.target.style.borderColor = "#333")}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#a0a0a0" }}>
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: "16px",
                  outline: "none",
                }}
              >
                <option value="">Selecione</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
                <option value="DEBIT_CARD">Cartão de Débito</option>
                <option value="BANK_TRANSFER">Transferência Bancária</option>
                <option value="PIX">PIX</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#a0a0a0" }}>
                Itens do Orçamento
              </label>
              {itens.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    style={{
                      flex: 2,
                      minWidth: "200px",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#333")}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Qtd"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    style={{
                      width: "80px",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Preço"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, "price", e.target.value)}
                    style={{
                      width: "120px",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    min="0"
                    step="0.01"
                    required
                  />
                  <select
                    value={item.issPercent ?? ""}
                    onChange={(e) => handleItemChange(index, "issPercent", e.target.value)}
                    style={{
                      width: "100px",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                    }}
                  >
                    <option value="">ISS</option>
                    <option value="2">2%</option>
                    <option value="3">3%</option>
                    <option value="4">4%</option>
                    <option value="5">5%</option>
                  </select>
                  <span style={{ padding: "16px", color: "#00e5ff", fontWeight: "600" }}>
                    R$ {calcularTotalItem(item).toFixed(2)}
                  </span>
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      style={{
                        color: "#ff5555",
                        background: "#1a1a1a",
                        border: "1px solid #ff555530",
                        width: "48px",
                        height: "48px",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ff555520";
                        e.currentTarget.style.borderColor = "#ff5555";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#1a1a1a";
                        e.currentTarget.style.borderColor = "#ff555530";
                      }}
                    >
                      <FiX size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#00e5ff",
                  background: "transparent",
                  border: "1px solid #00e5ff40",
                  padding: "12px 24px",
                  borderRadius: "100px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1rem",
                  marginTop: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#00e5ff10";
                  e.currentTarget.style.borderColor = "#00e5ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "#00e5ff40";
                }}
              >
                <FiPlus size={18} /> Adicionar Item
              </button>
            </div>

            <div style={{ textAlign: "right", fontSize: "28px", fontWeight: "700", color: "#00e5ff" }}>
              Total: R$ {totalGeral.toFixed(2)}
            </div>

            <button
              type="submit"
              disabled={loading || !clienteSelecionado}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "100px",
                background: "linear-gradient(135deg, #00e5ff, #0077ff)",
                color: "#000",
                fontWeight: "700",
                fontSize: "1.1rem",
                border: "none",
                cursor: clienteSelecionado && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                opacity: clienteSelecionado && !loading ? 1 : 0.5,
                boxShadow: "0 8px 20px rgba(0, 229, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (clienteSelecionado && !loading) {
                  e.currentTarget.style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {loading ? "Salvando..." : isEditing ? "Atualizar Orçamento" : "Criar Orçamento"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}