// src/utils/statusMaps.ts
export const estimateStatusMap: Record<string, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  converted: 'Convertido',
  DRAFT: 'Pendente',
  APPROVED: 'Aceito',
  CONVERTED: 'Convertido',
};

export const getEstimateStatusLabel = (status: string): string =>
  estimateStatusMap[status] || status;