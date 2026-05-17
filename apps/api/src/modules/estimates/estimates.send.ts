import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EstimatesSendService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT ?? '587', 10);
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: { user: emailUser, pass: emailPass },
    });
  }

  async sendEstimateByEmail(to: string, estimate: any, pdfBuffer?: Buffer) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"MecPro" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Orçamento #${estimate.id}`,
      html: `
        <h1>Orçamento #${estimate.id}</h1>
        <p><strong>Cliente:</strong> ${estimate.client?.name || 'N/A'}</p>
        <p><strong>Data:</strong> ${new Date(estimate.date).toLocaleDateString('pt-BR')}</p>
        <p><strong>Total:</strong> R$ ${Number(estimate.total).toFixed(2)}</p>
        <p><strong>Status:</strong> ${estimate.status}</p>
        <p>Segue em anexo o orçamento em PDF.</p>
      `,
      attachments: pdfBuffer ? [{ filename: `orcamento-${estimate.id}.pdf`, content: pdfBuffer }] : [],
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendEstimateByWhatsApp(phone: string, estimateId: number) {
    const message = encodeURIComponent(`Olá, segue o orçamento #${estimateId} do MecPro.`);
    const url = `https://wa.me/${phone}?text=${message}`;
    return { url };
  }
}