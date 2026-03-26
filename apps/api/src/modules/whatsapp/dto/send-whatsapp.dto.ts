// src/modules/whatsapp/dto/send-whatsapp.dto.ts
export class SendWhatsappDto {
  phone: string;
  message: string;
  pdfUrl?: string;
}