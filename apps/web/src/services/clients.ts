// src/services/clients.ts
import api from './api';

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  plate?: string;
  vehicle?: string;
  address?: string;
  cep?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getClients = async (): Promise<Client[]> => {
  try {
    const response = await api.get('/clients?page=1&limit=100');
    console.log('📡 Resposta /clients:', response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    if (response.data?.clients && Array.isArray(response.data.clients)) {
      return response.data.clients;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    return [];
  }
};

// ✅ NOVA: Buscar cliente por ID
export const getClientById = async (id: number): Promise<Client | null> => {
  try {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error);
    return null;
  }
};

// ✅ NOVA: Criar cliente
export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
  try {
    const response = await api.post('/clients', clientData);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    throw error;
  }
};

// ✅ NOVA: Atualizar cliente
export const updateClient = async (id: number, clientData: Partial<Client>): Promise<Client> => {
  try {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    throw error;
  }
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

export const getVehicleDisplay = (client: Client): string => {
  if (client.vehicle && client.plate) return `${client.vehicle} - ${client.plate}`;
  if (client.vehicle) return client.vehicle;
  if (client.plate) return client.plate;
  return 'Não informado';
};