import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import { InvoiceDetails } from './InvoiceDetails';

interface Invoice {
  id: number;
  number: string;
  total: number;
  client: {
    name: string;
    phone: string;
  };
}

export const DetalhesFatura: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/invoices/${id}`);
        setInvoice(response.data);
      } catch (err) {
        setError('Fatura não encontrada.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;
  if (!invoice) return <div>Fatura não encontrada.</div>;

  return <InvoiceDetails invoice={invoice} />;
};