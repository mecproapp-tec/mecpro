import { useState } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { sendMessageToClient } from '../services/admin';

interface Props {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSent: () => void;
}

export default function SendMessageModal({ clientId, clientName, onClose, onSent }: Props) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await sendMessageToClient(clientId, { subject, message });
      alert('Mensagem enviada com sucesso!');
      onSent();
      onClose();
    } catch (error) {
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray900 rounded-xl border border-gray800 w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Enviar mensagem para {clientName}</h2>
          <button onClick={onClose}><FiX className="text-gray-400" /></button>
        </div>
        <input
          type="text"
          placeholder="Assunto"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full bg-gray800 border border-gray700 rounded-lg px-4 py-2 text-white mb-3"
        />
        <textarea
          rows={4}
          placeholder="Mensagem"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full bg-gray800 border border-gray700 rounded-lg px-4 py-2 text-white"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray700 rounded">Cancelar</button>
          <button onClick={handleSend} disabled={sending} className="px-4 py-2 bg-neonBlue rounded font-bold">
            {sending ? 'Enviando...' : <><FiSend className="inline mr-1" /> Enviar</>}
          </button>
        </div>
      </div>
    </div>
  );
}