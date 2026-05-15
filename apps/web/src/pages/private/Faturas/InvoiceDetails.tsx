import React, { useState } from 'react';
import { sendInvoiceWhatsApp } from '../../../services/api';

interface Invoice {
  id: number;
  number: string;
  total: number;
  client: {
    name: string;
    phone: string;
  };
}

interface InvoiceDetailsProps {
  invoice: Invoice;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice }) => {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!invoice.client.phone) {
      alert('Cliente não possui telefone cadastrado.');
      return;
    }
    setSending(true);
    try {
      const result = await sendInvoiceWhatsApp(invoice.id, invoice.client.phone);
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
      } else {
        alert(result.message || 'Erro ao enviar. Tente novamente.');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Erro ao enviar WhatsApp. Verifique o telefone do cliente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2>Fatura #{invoice.number}</h2>
      <p><strong>Cliente:</strong> {invoice.client.name}</p>
      <p><strong>Telefone:</strong> {invoice.client.phone || 'Não cadastrado'}</p>
      <p><strong>Total:</strong> R$ {invoice.total.toFixed(2)}</p>
      <button onClick={handleSend} disabled={sending || !invoice.client.phone} style={{ padding: '8px 16px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1 }}>
        {sending ? 'Enviando...' : 'Enviar via WhatsApp'}
      </button>
    </div>
  );
};