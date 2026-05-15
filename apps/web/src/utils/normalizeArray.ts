export function normalizeArray<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.clients)) return data.clients;
  if (data && Array.isArray(data.estimates)) return data.estimates;
  if (data && Array.isArray(data.invoices)) return data.invoices;
  if (data && Array.isArray(data.notifications)) return data.notifications;
  if (data && Array.isArray(data.appointments)) return data.appointments;
  console.warn('Formato inesperado:', data);
  return [];
}