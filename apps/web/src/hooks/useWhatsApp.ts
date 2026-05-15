import { sendWhatsApp } from '../services/api';
import { useState } from 'react';

export const useWhatsApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviarWhatsApp = async (
    tipo: 'invoice' | 'estimate',
    id: number,
    phoneNumber?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await sendWhatsApp(tipo, id, phoneNumber);
      
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
        return { success: true, message: 'Link do WhatsApp gerado com sucesso!' };
      } else {
        const errorMsg = result.message || 'Erro ao enviar WhatsApp';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      console.error('Erro no hook useWhatsApp:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao enviar WhatsApp. Tente novamente.';
      setError(errorMsg);
      return { success: false, message: errorMsg, error };
    } finally {
      setLoading(false);
    }
  };

  return { enviarWhatsApp, loading, error };
};