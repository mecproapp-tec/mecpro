// apps/web/src/pages/private/Faturas/NovaFatura.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FiPlus, FiX, FiArrowLeft } from "react-icons/fi";
import { getClients } from "../../../services/clients";
import type { Client } from "../../../services/clients";
import type { Estimate } from "../../../services/Estimates";
import { createInvoice, updateInvoice, getInvoiceById } from "../../../services/invoices";
import type { InvoiceItem } from "../../../services/invoices";

export default function NovaFatura() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = !!id;

  const estimateFromState = location.state?.estimate as Estimate | undefined;

  const [clientes, setClientes] = useState<Client[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Client | null>(null);
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<Omit<InvoiceItem, "total">[]>([
    { description: "", quantity: 1, price: undefined as unknown as number, issPercent: undefined },
  ]);
  const [status, setStatus] = useState<"PENDING" | "PAID" | "CANCELED">("PENDING");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    if (isEditing && clientes.length > 0) {
      carregarFatura();
    }
  }, [id, clientes.length]);

  useEffect(() => {
    if (estimateFromState && clientes.length > 0) {
      const cliente = clientes.find((c) => c.id === estimateFromState.clientId);
      if (cliente) setClienteSelecionado(cliente);
      const itemsFromEstimate = estimateFromState.items.map((item) => ({
        description: item.description,
        quantity: 1,
        price: item.price !== undefined && item.price !== null ? item.price : undefined,
        issPercent: item.issPercent !== undefined && item.issPercent !== null ? item.issPercent : undefined,
      }));
      setItens(itemsFromEstimate);
    }
  }, [estimateFromState, clientes]);

  const carregarClientes = async () => {
    try {
      const data = await getClients();
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar clientes", err);
      setClientes([]);
    }
  };

  const carregarFatura = async () => {
    try {
      const fatura = await getInvoiceById(Number(id));
      const cliente = clientes.find((c) => c.id === fatura.clientId);
      setClienteSelecionado(cliente || null);
      setItens(fatura.items.map(({ description, quantity, price, issPercent }) => ({
        description,
        quantity,
        price: price !== undefined && price !== null ? price : undefined,
        issPercent: issPercent !== undefined && issPercent !== null ? issPercent : undefined,
      })));
      setStatus(fatura.status);
      setPaymentMethod(fatura.paymentMethod || "");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar fatura");
    }
  };

  const handleAddItem = () => {
    setItens([...itens, { description: "", quantity: 1, price: undefined as unknown as number, issPercent: undefined }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof Omit<InvoiceItem, "total">,
    value: string | number
  ) => {
    const novos = [...itens];
    if (field === "quantity") {
      const numValue = value === "" ? 1 : Number(value);
      novos[index][field] = isNaN(numValue) ? 1 : numValue;
    } else if (field === "price") {
      const numValue = value === "" ? undefined : Number(value);
      novos[index].price = (numValue === undefined || isNaN(numValue)) ? undefined : numValue;
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
    const iss = item.issPercent ? price * (item.issPercent / 100) : 0;
    return (price + iss) * quantity;
  };

  const totalGeral = itens.reduce((acc, item) => acc + calcularTotalItem(item), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionado) return;

    setLoading(true);
    setError("");

    const payload = {
      clientId: clienteSelecionado.id,
      items: itens.map(({ description, quantity, price, issPercent }) => ({
        description,
        quantity: quantity || 1,
        price: price || 0,
        issPercent: issPercent || 0,
      })),
      status,
      paymentMethod: paymentMethod || undefined,
    };

    try {
      if (isEditing) {
        await updateInvoice(Number(id), payload);
      } else {
        await createInvoice(payload);
      }
      navigate("/faturas");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao salvar fatura");
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = Array.isArray(clientes) && clientes.length > 0
    ? clientes.filter(
        (c) =>
          c.name.toLowerCase().includes(busca.toLowerCase()) ||
          (c.plate && c.plate.toLowerCase().includes(busca.toLowerCase()))
      )
    : [];

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
            onClick={() => navigate("/faturas")}
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
            {isEditing ? "Editar Fatura" : "Nova Fatura"}
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
              {!isEditing && !estimateFromState && (
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
                  {!isEditing && !estimateFromState && (
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
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
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
              >
                <option value="PENDING">Pendente</option>
                <option value="PAID">Paga</option>
                <option value="CANCELED">Cancelada</option>
              </select>
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
                onFocus={(e) => (e.target.style.borderColor = "#00e5ff")}
                onBlur={(e) => (e.target.style.borderColor = "#333")}
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
                Itens da Fatura
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
                    value={item.price === undefined ? "" : item.price}
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
              {loading ? "Salvando..." : isEditing ? "Atualizar Fatura" : "Criar Fatura"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}