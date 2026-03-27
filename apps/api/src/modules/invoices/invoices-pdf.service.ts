import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BrowserPoolService } from '../../shared/browser-pool.service';

@Injectable()
export class InvoicesPdfService {
  private readonly logger = new Logger(InvoicesPdfService.name);

  constructor(private readonly browserPool: BrowserPoolService) {}

  private async getTemplateContent(): Promise<string> {
    const possiblePaths = [
      path.join(__dirname, 'invoice-pdf.hbs'),
      path.join(process.cwd(), 'src', 'modules', 'invoices', 'invoice-pdf.hbs'),
      path.join(process.cwd(), 'dist', 'modules', 'invoices', 'invoice-pdf.hbs'),
    ];

    for (const p of possiblePaths) {
      try {
        const content = await readFile(p, 'utf8');
        this.logger.log(`Template encontrado em: ${p}`);
        return content;
      } catch (e) {
        // continua
      }
    }
    throw new Error('Template invoice-pdf.hbs não encontrado em nenhum caminho');
  }

  async generateInvoicePdf(invoice: any, tenant: any): Promise<Buffer> {
    this.logger.log(`Gerando PDF da fatura ${invoice.id}`);
    try {
      const client = invoice.client;

      const vehicleDetails =
        client?.vehicleBrand && client?.vehicleModel
          ? `${client.vehicleBrand} ${client.vehicleModel}${
              client.vehicleYear ? ` ${client.vehicleYear}` : ''
            }${client.vehicleColor ? ` - ${client.vehicleColor}` : ''}`.trim()
          : client?.vehicle || 'Não informado';

      const plate = client?.plate || 'Não informado';

      let subtotal = 0;
      let issTotal = 0;

      const itemsWithTotal = invoice.items.map((item) => {
        const itemTotal = item.price * item.quantity;
        const iss = item.issPercent ? itemTotal * (item.issPercent / 100) : 0;
        subtotal += itemTotal;
        issTotal += iss;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price.toFixed(2),
          total: (itemTotal + iss).toFixed(2),
        };
      });

      const total = subtotal + issTotal;

      const templateContent = await this.getTemplateContent();
      const template = Handlebars.compile(templateContent);

      const data = {
        invoiceNumber: invoice.number,
        client: {
          name: client.name,
          document: client.document || 'Não informado',
          address: client.address || '',
          phone: client.phone,
          vehicle: vehicleDetails,
          plate,
        },
        issueDate: new Date(invoice.createdAt).toLocaleDateString('pt-BR'),
        dueDate: '',
        status: this.getStatusText(invoice.status),
        items: itemsWithTotal,
        subtotal: subtotal.toFixed(2),
        issRate: 0,
        issValue: issTotal.toFixed(2),
        total: total.toFixed(2),
        companyName: tenant?.name || process.env.COMPANY_NAME || 'Oficina',
        companyDocument: tenant?.documentNumber || process.env.COMPANY_DOCUMENT || '',
        companyPhone: tenant?.phone || process.env.COMPANY_PHONE || '',
        companyEmail: tenant?.email || process.env.COMPANY_EMAIL || '',
        logoUrl: tenant?.logoUrl || process.env.LOGO_URL || '',
      };

      const html = template(data);
      this.logger.debug(`HTML gerado, tamanho: ${html.length}`);

      // Opcional: salvar o HTML em arquivo para inspeção (remover em produção)
      // const fs = require('fs');
      // fs.writeFileSync('/tmp/invoice.html', html);
      // this.logger.log(`HTML salvo em /tmp/invoice.html`);

      const browser = await this.browserPool.getBrowser();
      const page = await browser.newPage();

      // Evita carregamento de recursos externos (imagens, fontes) que podem travar
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.resourceType() === 'image' || request.resourceType() === 'font') {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Configuração mais tolerante
      await page.setContent(html, {
        waitUntil: 'load', // 'networkidle0' pode esperar para sempre
        timeout: 60000,
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        timeout: 60000,
      });

      await page.close();

      this.logger.log(`PDF gerado com sucesso, tamanho: ${pdfBuffer.length} bytes`);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF da fatura ${invoice.id}:`, error);
      throw error;
    }
  }

  private getStatusText(status: string): string {
    const map: Record<string, string> = {
      PAID: 'Paga',
      PENDING: 'Pendente',
      CANCELED: 'Cancelada',
    };
    return map[status] || 'Desconhecido';
  }
}