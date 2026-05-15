import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    return this.generateDocument({
      title: 'Fatura',
      number: invoice.number,
      date: invoice.createdAt,
      client: invoice.client,
      items: invoice.items,
      total: invoice.total,
      tenant: invoice.tenant,
    });
  }

  async generateEstimatePdf(estimate: any): Promise<Buffer> {
    return this.generateDocument({
      title: 'Orçamento',
      number: estimate.id.toString(),
      date: estimate.date,
      client: estimate.client,
      items: estimate.items,
      total: estimate.total,
      tenant: estimate.tenant,
    });
  }

  private generateDocument(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cabeçalho
      doc.fontSize(20).text(data.title, { align: 'center' });
      doc.moveDown();

      // Informações da oficina (tenant) - dados ATUALIZADOS
      if (data.tenant) {
        doc.fontSize(12).text(data.tenant.name || 'Oficina');
        doc.text(`CNPJ/CPF: ${data.tenant.documentNumber || '—'}`);
        doc.text(`Endereço: ${data.tenant.address || '—'}`);
        doc.text(`Telefone: ${data.tenant.phone || '—'}`);
        doc.text(`E-mail: ${data.tenant.email || '—'}`);
        doc.moveDown();
      }

      // Dados do documento
      doc.fontSize(12);
      doc.text(`Número: ${data.number}`);
      doc.text(`Data: ${new Date(data.date).toLocaleDateString()}`);
      doc.moveDown();

      // Cliente
      if (data.client) {
        doc.text(`Cliente: ${data.client.name}`);
        doc.text(`Telefone: ${data.client.phone || '—'}`);
        doc.text(`Veículo: ${data.client.vehicle || '—'} - Placa: ${data.client.plate || '—'}`);
        doc.moveDown();
      }

      // Tabela de itens
      if (data.items && data.items.length) {
        doc.text('Itens:');
        doc.moveDown(0.5);
        const startX = doc.x;
        const startY = doc.y;
        doc.fontSize(10);
        doc.text('Descrição', startX, startY);
        doc.text('Qtd', startX + 250, startY);
        doc.text('Preço', startX + 320, startY);
        doc.text('Total', startX + 400, startY);
        doc.moveDown();

        let y = doc.y;
        for (const item of data.items) {
          const description = item.description || '—';
          const quantity = item.quantity || 1;
          const price = Number(item.price) || 0;
          const subtotal = price * quantity;
          doc.text(description.substring(0, 40), startX, y);
          doc.text(quantity.toString(), startX + 250, y);
          doc.text(`R$ ${price.toFixed(2)}`, startX + 320, y);
          doc.text(`R$ ${subtotal.toFixed(2)}`, startX + 400, y);
          doc.moveDown();
          y = doc.y;
        }
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Geral: R$ ${Number(data.total).toFixed(2)}`, { align: 'right' });
      } else {
        doc.text('Nenhum item encontrado.');
      }

      doc.end();
    });
  }
}