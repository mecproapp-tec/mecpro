import { useState, useEffect, useRef } from 'react';
import { sendNotification, scheduleNotification, getTenants } from '../../services/admin';

export default function BulkNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // ✅ Flag para garantir que a busca seja feita apenas uma vez
  const fetched = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Evita chamadas duplicadas (Strict Mode, remontagem, etc.)
    if (fetched.current) return;
    fetched.current = true;

    // Permite cancelar a requisição se o componente desmontar
    abortControllerRef.current = new AbortController();

    const fetchTenants = async () => {
      try {
        const data = await getTenants({ signal: abortControllerRef.current?.signal });
        setTenants(data);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao carregar a lista de tenants:', error);
        }
      }
    };

    fetchTenants();

    // Cleanup: cancela requisição pendente ao desmontar
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []); // dependência vazia – executa uma única vez

  const handleSend = async () => {
    setLoading(true);
    try {
      const data: any = { title, message, target };
      if (target === 'specific') data.tenantIds = selectedTenants;
      await sendNotification(data);
      alert('Notificação enviada com sucesso!');
      setTitle('');
      setMessage('');
      setSelectedTenants([]);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      alert('Erro ao enviar notificação');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      alert('Defina data e hora para o agendamento');
      return;
    }
    const schedule = new Date(`${scheduleDate}T${scheduleTime}:00`);
    setLoading(true);
    try {
      const data: any = { title, message, schedule, target };
      if (target === 'specific') data.tenantIds = selectedTenants;
      await scheduleNotification(data);
      alert('Notificação agendada com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      alert('Erro ao agendar notificação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neonBlue mb-6">Enviar Notificação</h1>
      <div className="bg-gray900 p-6 rounded-lg border border-gray800">
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-4 py-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-gray800 border border-gray700 rounded-lg px-4 py-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Destinatários</label>
          <div className="flex gap-4">
            <label className="flex items-center text-white">
              <input
                type="radio"
                value="all"
                checked={target === 'all'}
                onChange={() => setTarget('all')}
                className="mr-2"
              /> Todos
            </label>
            <label className="flex items-center text-white">
              <input
                type="radio"
                value="specific"
                checked={target === 'specific'}
                onChange={() => setTarget('specific')}
                className="mr-2"
              /> Selecionar
            </label>
          </div>
        </div>

        {target === 'specific' && (
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Selecione os tenants</label>
            <div className="max-h-40 overflow-y-auto bg-gray800 border border-gray700 rounded-lg p-2">
              {tenants.length === 0 ? (
                <p className="text-gray-500 text-center">Nenhum tenant encontrado</p>
              ) : (
                tenants.map((t) => (
                  <label key={t.id} className="flex items-center text-white p-1 hover:bg-gray700">
                    <input
                      type="checkbox"
                      value={t.id}
                      checked={selectedTenants.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTenants([...selectedTenants, t.id]);
                        } else {
                          setSelectedTenants(selectedTenants.filter(id => id !== t.id));
                        }
                      }}
                      className="mr-2"
                    />
                    {t.name} ({t.email})
                  </label>
                ))
              )}
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Selecionados: <span className="text-neonBlue font-semibold">{selectedTenants.length}</span> tenant(s)
            </div>
          </div>
        )}

        {title && message && (
          <div className="mb-4 p-4 bg-gray800 rounded-lg border border-gray700">
            <p className="text-gray-400 text-sm mb-2">Pré‑visualização:</p>
            <div className="bg-gray900 p-3 rounded border border-gray700">
              <p className="font-bold text-white">{title}</p>
              <p className="text-gray-300 mt-1 whitespace-pre-wrap">{message}</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Agendar (opcional)</label>
          <div className="flex gap-4">
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-gray800 border border-gray700 rounded-lg px-4 py-2 text-white"
            />
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="bg-gray800 border border-gray700 rounded-lg px-4 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-neonBlue text-black px-6 py-2 rounded-lg font-bold hover:bg-cyan-300 transition disabled:opacity-50"
          >
            Enviar Agora
          </button>
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="bg-gray700 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray600 transition disabled:opacity-50"
          >
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}