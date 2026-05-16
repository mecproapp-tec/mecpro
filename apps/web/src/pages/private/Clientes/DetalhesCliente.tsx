import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiSave,
} from "react-icons/fi";
import toast from "react-hot-toast";

import {
  getClientById,
  type Client,
  getVehicleDisplay,
} from "../../../services/clients";
import {
  getEstimates,
  type Estimate,
} from "../../../services/Estimates";
import {
  getInvoices,
  type Invoice,
} from "../../../services/invoices";
import {
  getAppointments,
  deleteAppointment,
  type Appointment,
} from "../../../services/appointments";
import api from "../../../services/api";
import { useWhatsApp } from "../../../hooks/useWhatsApp";

function maskDocumentNumber(number: string): string {
  if (!number) return "";
  return "•".repeat(number.replace(/\D/g, "").length);
}

function getStatusLabel(status: string, type: "estimate" | "invoice"): string {
  if (type === "estimate") {
    if (status === "DRAFT") return "Pendente";
    if (status === "APPROVED") return "Aceito";
    if (status === "CONVERTED") return "Convertido";
    return status;
  } else {
    if (status === "PENDING") return "Pendente";
    if (status === "PAID") return "Paga";
    if (status === "CANCELED") return "Cancelada";
    return status;
  }
}

function getStatusColor(status: string, type: "estimate" | "invoice"): string {
  if (type === "estimate") {
    if (status === "DRAFT") return "#ffaa00";
    if (status === "APPROVED") return "#00ff88";
    if (status === "CONVERTED") return "#6c757d";
    return "#fff";
  } else {
    if (status === "PENDING") return "#ffaa00";
    if (status === "PAID") return "#00ff88";
    if (status === "CANCELED") return "#ff4444";
    return "#fff";
  }
}

function calculateTotalWithIss(items?: Invoice["items"]): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const quantity = item.quantity || 1;
    const subtotal = price * quantity;
    const issPercent = Number(item.issPercent) || 0;
    const issValue = subtotal * (issPercent / 100);
    return acc + subtotal + issValue;
  }, 0);
}

export default function DetalhesCliente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enviarWhatsApp } = useWhatsApp();

  const [cliente, setCliente] = useState<Client | null>(null);
  const [orcamentos, setOrcamentos] = useState<Estimate[]>([]);
  const [faturas, setFaturas] = useState<Invoice[]>([]);
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDoc, setShowDoc] = useState(false);
  const [savingObs, setSavingObs] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const clientId = Number(id);
    Promise.all([
      getClientById(clientId),
      getEstimates(1, 100).then(res => {
        let data = Array.isArray(res) ? res : res.data || [];
        return data.filter((e: any) => e.clientId === clientId);
      }),
      getInvoices().then(res => {
        let data = Array.isArray(res) ? res : res.data || [];
        return data.filter((i: any) => i.clientId === clientId);
      }),
      getAppointments().then(res => {
        let data = Array.isArray(res) ? res : res.data || [];
        return data.filter((a: any) => a.clientId === clientId);
      }),
    ])
      .then(([cli, est, inv, apps]) => {
        setCliente(cli);
        setOrcamentos(est);
        setFaturas(inv);
        setAgendamentos(apps);
        carregarObservacoes(clientId);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const carregarObservacoes = async (clientId: number) => {
    try {
      const response = await api.get(`/clients/${clientId}/observations`);
      setObservacoes(response.data?.observations || "");
    } catch (error) {
      setObservacoes("");
    }
  };

  const handleSaveObservacoes = async () => {
    if (!cliente) return;
    setSavingObs(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.put(`/clients/${cliente.id}/observations`, { observations: observacoes });
      setSuccessMsg("Observações salvas com sucesso!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      setErrorMsg("Erro ao salvar observações. Tente novamente.");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setSavingObs(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!confirm("Excluir este agendamento?")) return;
    try {
      await deleteAppointment(appointmentId);
      setAgendamentos(prev => prev.filter(a => a.id !== appointmentId));
      toast.success("Agendamento excluído com sucesso!");
    } catch (err) {
      toast.error("Erro ao excluir agendamento");
    }
  };

  const handleDeleteEstimate = async (estimateId: number) => {
    if (!confirm("Excluir este orçamento? Essa ação não pode ser desfeita.")) return;
    try {
      await api.delete(`/estimates/${estimateId}`);
      setOrcamentos(prev => prev.filter(est => est.id !== estimateId));
      toast.success("Orçamento excluído!");
    } catch (err) {
      toast.error("Erro ao excluir orçamento");
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!confirm("Excluir esta fatura? Essa ação não pode ser desfeita.")) return;
    try {
      await api.delete(`/invoices/${invoiceId}`);
      setFaturas(prev => prev.filter(fat => fat.id !== invoiceId));
      toast.success("Fatura excluída!");
    } catch (err) {
      toast.error("Erro ao excluir fatura");
    }
  };

  const handleWhatsAppEstimate = async (estimate: Estimate) => {
    const phone = estimate.client?.phone || cliente?.phone;
    if (!phone) {
      toast.error("Cliente não possui telefone cadastrado.");
      return;
    }
    const result = await enviarWhatsApp("estimate", estimate.id, phone);
    if (result?.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank");
    }
  };

  const handleWhatsAppInvoice = async (invoice: Invoice) => {
    const phone = invoice.client?.phone || cliente?.phone;
    if (!phone) {
      toast.error("Cliente não possui telefone cadastrado.");
      return;
    }
    const result = await enviarWhatsApp("invoice", invoice.id, phone);
    if (result?.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank");
    }
  };

  const handleWhatsAppAppointment = async (appointment: Appointment) => {
    const phone = appointment.client?.phone || cliente?.phone;
    if (!phone) {
      toast.error("Cliente não possui telefone cadastrado.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/55${cleanPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePDF = async (item: Estimate | Invoice, type: "estimate" | "invoice") => {
    try {
      const response = await api.get("/tenants/me");
      const oficina = response.data?.data || {};
      const win = window.open("", "_blank");
      if (!win) return;
      const totalComIss = type === "invoice" && "items" in item ? calculateTotalWithIss(item.items) : Number(item.total);
      win.document.write(`<html><head><title>${type === "estimate" ? "Orçamento" : "Fatura"} ${item.id}</title>
        <style>body{font-family:Arial;padding:20px}.header{display:flex;align-items:center;gap:20px;margin-bottom:30px;border-bottom:2px solid #00e5ff;padding-bottom:20px}
        .logo{max-width:100px;max-height:80px}.info{flex:1}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}
        th{background:#f2f2f2}.valor{text-align:right}.total-row{font-weight:700;background:#f9f9f9}.total-geral{font-size:1.2rem;font-weight:700;margin-top:20px;text-align:right}</style>
        </head><body><div class="header">${oficina.logoUrl ? `<img src="${oficina.logoUrl}" class="logo" />` : ""}
        <div class="info"><h2>${oficina.nome || "Oficina"}</h2><p>${oficina.documentType || ""} ${oficina.documentNumber || ""}</p>
        <p>${oficina.address || ""}</p><p>Tel: ${oficina.phone || ""} | Email: ${oficina.email || ""}</p></div></div>
        <h1>${type === "estimate" ? "Orçamento" : "Fatura"}</h1><p><strong>Cliente:</strong> ${cliente?.name}</p>
        <p><strong>Data:</strong> ${new Date(item.date || (item as any).createdAt).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${getStatusLabel(item.status, type)}</p>
        <div class="details"><h3>Itens</h3><table><thead><tr><th>Descrição</th><th class="valor">Qtd</th><th class="valor">Preço</th><th class="valor">ISS</th><th class="valor">Total</th></tr></thead>
        <tbody>${(item.items || []).map((i: any) => { const price = Number(i.price); const qty = i.quantity || 1; const subtotal = price * qty; const iss = (Number(i.issPercent) || 0) * subtotal / 100; const totalItem = subtotal + iss; return `<tr><td style="text-align:left">${i.description}</td><td class="valor">${qty}</td><td class="valor">${price.toFixed(2)}</td><td class="valor">${i.issPercent ? i.issPercent + '%' : '-'}</td><td class="valor">${totalItem.toFixed(2)}</td>`; }).join("")}</tbody>
        <tfoot><tr class="total-row"><td colspan="4" class="valor"><strong>Total</strong></td><td class="valor"><strong>${totalComIss.toFixed(2)}</strong></td></tr></tfoot>
        </div>
        <div class="total-geral"><strong>Total: R$ ${totalComIss.toFixed(2)}</strong></div></body></html>`);
      win.document.close();
      win.print();
    } catch (error) {
      toast.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const formatarDataHoraBrasilia = (dataISO: string): string => {
    if (!dataISO) return "Data inválida";
    try {
      const date = new Date(dataISO);
      if (isNaN(date.getTime())) return "Data inválida";
      return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    } catch {
      return "Data inválida";
    }
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black flex items-center justify-center text-[#00e5ff]">Carregando dados...</div>;
  if (!cliente) return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black flex items-center justify-center text-white">Cliente não encontrado</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black py-10 px-6 text-gray-200 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/clientes")}
            className="bg-[#111] border border-[#00e5ff]/20 w-11 h-11 rounded-xl flex items-center justify-center text-[#00e5ff] hover:bg-[#1a1a1a] transition-all"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00e5ff] to-[#7fdbff] bg-clip-text text-transparent">
            Detalhes do Cliente
          </h1>
        </div>

        {successMsg && (
          <div className="bg-[#00ff9d20] border border-[#00ff9d] text-[#aaffdd] px-4 py-3 rounded-xl mb-4 text-center">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-[#ff444420] border border-[#ff4444] text-[#ff8888] px-4 py-3 rounded-xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <div className="bg-[#0f0f0f] rounded-2xl p-6 mb-8 border border-[#00e5ff]/20">
          <h2 className="text-2xl font-semibold text-white mb-5">{cliente.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-500 text-xs block mb-1">Telefone</span>
              <span className="text-white text-base">{cliente.phone || "-"}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block mb-1">Veículo</span>
              <span className="text-white text-base">{getVehicleDisplay(cliente)}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block mb-1">Placa</span>
              <span className="text-white text-base">{cliente.plate || "-"}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block mb-1">Documento</span>
              <span className="text-white text-base flex items-center gap-2">
                {showDoc ? cliente.document : maskDocumentNumber(cliente.document || "")}
                <button onClick={() => setShowDoc(!showDoc)} className="text-[#00e5ff] hover:text-[#7fdbff]">
                  {showDoc ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block mb-1">Endereço</span>
              <span className="text-white text-base">{cliente.address || "-"}</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#00e5ff]/20">
            <span className="text-gray-500 text-xs block mb-1">Observações</span>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações sobre o cliente..."
              className="w-full bg-[#111] border border-[#00e5ff]/20 rounded-xl p-3 text-white resize-y focus:outline-none focus:border-[#00e5ff]/50"
            />
            <button
              onClick={handleSaveObservacoes}
              disabled={savingObs}
              className="mt-3 bg-[#00e5ff] text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#00e5ff]/80 disabled:opacity-60 transition-all"
            >
              <FiSave size={16} /> {savingObs ? "Salvando..." : "Salvar Observações"}
            </button>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-semibold flex items-center gap-3 mb-5">
            <FiFileText /> Orçamentos ({orcamentos.length})
          </h3>
          {orcamentos.length === 0 ? (
            <div className="bg-[#0f0f0f] rounded-xl p-8 text-center text-gray-500 border border-[#00e5ff]/20">
              Nenhum orçamento encontrado.
            </div>
          ) : (
            <div className="bg-[#0f0f0f] rounded-xl border border-[#00e5ff]/20 overflow-x-auto">
              <table className="w-full table-fixed border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#111] border-b border-[#00e5ff]/20">
                    <th className="w-[25%] text-left px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Data
                    </th>
                    <th className="w-[20%] text-right px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Total
                    </th>
                    <th className="w-[25%] text-center px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Status
                    </th>
                    <th className="w-[30%] text-center px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orcamentos.map(orc => (
                    <tr
                      key={orc.id}
                      className="border-b border-[#00e5ff]/10 hover:bg-[#ffffff05] transition-colors"
                    >
                      <td className="px-6 py-5 text-sm whitespace-nowrap">
                        {new Date(orc.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-[#00e5ff] text-right whitespace-nowrap">
                        R$ {Number(orc.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${getStatusColor(orc.status, "estimate")}20`,
                            color: getStatusColor(orc.status, "estimate"),
                          }}
                        >
                          {getStatusLabel(orc.status, "estimate")}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handlePDF(orc, "estimate")}
                            className="bg-[#111] border border-[#00e5ff]/20 w-8 h-8 rounded-lg flex items-center justify-center text-[#00e5ff] hover:bg-[#1a1a1a] transition-colors"
                            title="Visualizar PDF"
                          >
                            <FiFileText size={14} />
                          </button>
                          <button
                            onClick={() => handleWhatsAppEstimate(orc)}
                            className="bg-[#111] border border-[#25D366]/40 w-8 h-8 rounded-lg flex items-center justify-center text-[#25D366] hover:bg-[#1a1a1a] transition-colors"
                            title="WhatsApp"
                          >
                            💬
                          </button>
                          <button
                            onClick={() => handleDeleteEstimate(orc.id)}
                            className="bg-[#111] border border-[#ff5555]/40 w-8 h-8 rounded-lg flex items-center justify-center text-[#ff5555] hover:bg-[#1a1a1a] transition-colors"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-semibold flex items-center gap-3 mb-5">
            <FiDollarSign /> Faturas ({faturas.length})
          </h3>
          {faturas.length === 0 ? (
            <div className="bg-[#0f0f0f] rounded-xl p-8 text-center text-gray-500 border border-[#00e5ff]/20">
              Nenhuma fatura encontrada.
            </div>
          ) : (
            <div className="bg-[#0f0f0f] rounded-xl border border-[#00e5ff]/20 overflow-x-auto">
              <table className="w-full table-fixed border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#111] border-b border-[#00e5ff]/20">
                    <th className="w-[30%] text-left px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Número
                    </th>
                    <th className="w-[20%] text-left px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Data
                    </th>
                    <th className="w-[15%] text-right px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Total
                    </th>
                    <th className="w-[20%] text-center px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Status
                    </th>
                    <th className="w-[15%] text-center px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.map(fat => {
                    const totalComIss = calculateTotalWithIss(fat.items);
                    return (
                      <tr
                        key={fat.id}
                        className="border-b border-[#00e5ff]/10 hover:bg-[#ffffff05] transition-colors"
                      >
                        <td className="px-6 py-5 text-sm whitespace-nowrap">
                          {fat.number}
                        </td>
                        <td className="px-6 py-5 text-sm whitespace-nowrap">
                          {new Date(fat.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-[#00e5ff] text-right whitespace-nowrap">
                          R$ {totalComIss.toFixed(2)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `${getStatusColor(fat.status, "invoice")}20`,
                              color: getStatusColor(fat.status, "invoice"),
                            }}
                          >
                            {getStatusLabel(fat.status, "invoice")}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handlePDF(fat, "invoice")}
                              className="bg-[#111] border border-[#00e5ff]/20 w-8 h-8 rounded-lg flex items-center justify-center text-[#00e5ff] hover:bg-[#1a1a1a] transition-colors"
                              title="Visualizar PDF"
                            >
                              <FiFileText size={14} />
                            </button>
                            <button
                              onClick={() => handleWhatsAppInvoice(fat)}
                              className="bg-[#111] border border-[#25D366]/40 w-8 h-8 rounded-lg flex items-center justify-center text-[#25D366] hover:bg-[#1a1a1a] transition-colors"
                              title="WhatsApp"
                            >
                              💬
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(fat.id)}
                              className="bg-[#111] border border-[#ff5555]/40 w-8 h-8 rounded-lg flex items-center justify-center text-[#ff5555] hover:bg-[#1a1a1a] transition-colors"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold flex items-center gap-3 mb-5">
            <FiClock /> Agendamentos ({agendamentos.length})
          </h3>
          {agendamentos.length === 0 ? (
            <div className="bg-[#0f0f0f] rounded-xl p-8 text-center text-gray-500 border border-[#00e5ff]/20">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <div className="bg-[#0f0f0f] rounded-xl border border-[#00e5ff]/20 overflow-x-auto">
              <table className="w-full table-fixed border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#111] border-b border-[#00e5ff]/20">
                    <th className="w-[30%] text-left px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Data/Hora
                    </th>
                    <th className="w-[50%] text-left px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Comentário
                    </th>
                    <th className="w-[20%] text-center px-6 py-4 text-[#00e5ff] text-sm font-semibold">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agendamentos.map(ag => (
                    <tr
                      key={ag.id}
                      className="border-b border-[#00e5ff]/10 hover:bg-[#ffffff05] transition-colors"
                    >
                      <td className="px-6 py-5 text-sm whitespace-nowrap">
                        {formatarDataHoraBrasilia(ag.date)}
                      </td>
                      <td className="px-6 py-5 text-sm break-words">
                        {ag.comment || "-"}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleWhatsAppAppointment(ag)}
                            className="bg-[#111] border border-[#25D366]/40 w-8 h-8 rounded-lg flex items-center justify-center text-[#25D366] hover:bg-[#1a1a1a] transition-colors"
                            title="WhatsApp"
                          >
                            💬
                          </button>
                          <button
                            onClick={() => handleDeleteAppointment(ag.id)}
                            className="bg-[#111] border border-[#ff5555]/40 w-8 h-8 rounded-lg flex items-center justify-center text-[#ff5555] hover:bg-[#1a1a1a] transition-colors"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}