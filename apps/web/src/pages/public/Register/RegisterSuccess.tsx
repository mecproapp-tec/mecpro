import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function RegisterSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success('Pagamento aprovado! Verifique seu e‑mail para ativar sua conta.');
    const timer = setTimeout(() => navigate('/login'), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'Inter, sans-serif' }}>
      <h1>✅ Pagamento confirmado!</h1>
      <p>Enviamos um e‑mail com um link para você definir sua senha e acessar o sistema.</p>
      <button onClick={() => navigate('/login')} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        Ir para o login
      </button>
    </div>
  );
}