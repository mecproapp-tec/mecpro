import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BrowserPoolService } from '../../shared/browser-pool.service';

@Injectable()
export class InvoicesPdfService {
  private readonly logger = new Logger(InvoicesPdfService.name);

  constructor(private readonly browserPool: BrowserPoolService) {}

  async generateInvoicePdf(invoice: any, tenant: any): Promise<Buffer> {
    if (!invoice) {
      throw new InternalServerErrorException('Dados da fatura inválidos');
    }

    this.logger.log(`📄 Gerando PDF da fatura #${invoice.id}`);

    let page: any;

    try {
      // =========================
      // NORMALIZAÇÃO
      // =========================
      const client = invoice.client || {};

      const vehicleDetails =
        client?.vehicleBrand && client?.vehicleModel
          ? `${client.vehicleBrand} ${client.vehicleModel}${
              client.vehicleYear ? ` ${client.vehicleYear}` : ''
            }${client.vehicleColor ? ` - ${client.vehicleColor}` : ''}`.trim()
          : client?.vehicle || 'Não informado';

      const plate = client?.plate || 'Não informado';

      let subtotal = 0;
      let issTotal = 0;

      const items = (invoice.items || []).map((item: any) => {
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;

        const itemTotal = price * quantity;

        const iss = item.issPercent
          ? itemTotal * (item.issPercent / 100)
          : 0;

        subtotal += itemTotal;
        issTotal += iss;

        return {
          description: item.description || '-',
          quantity,
          unitPrice: price.toFixed(2),
          issPercent: item.issPercent || 0,
          total: (itemTotal + iss).toFixed(2),
        };
      });

      const total = subtotal + issTotal;

      const issueDate = invoice.createdAt
        ? new Date(invoice.createdAt).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');

      const dueDate = '';

      const statusMap: Record<string, string> = {
        PENDING: 'Pendente',
        PAID: 'Paga',
        CANCELED: 'Cancelada',
      };

      const status =
        statusMap[invoice.status] || invoice.status || 'Pendente';

      // =========================
      // EMPRESA
      // =========================
      const companyName =
        tenant?.name || process.env.COMPANY_NAME || 'Oficina Mecânica';

      const companyDocument =
        tenant?.documentNumber ||
        process.env.COMPANY_DOCUMENT ||
        '00.000.000/0001-00';

      const companyPhone =
        tenant?.phone ||
        process.env.COMPANY_PHONE ||
        '(11) 0000-0000';

      const companyEmail =
        tenant?.email ||
        process.env.COMPANY_EMAIL ||
        'contato@empresa.com';

      const logoUrl = tenant?.logoUrl || process.env.LOGO_URL || '';

      // =========================
      // TEMPLATE
      // =========================
      let templateContent: string;
      const templatePath = path.resolve(
  process.cwd(),
  'src/modules/invoices/invoice-pdf.hbs',
);

      try {
        templateContent = await readFile(templatePath, 'utf-8');
      } catch {
        this.logger.warn('⚠️ Template não encontrado, usando fallback');

        templateContent = `
          <html>
            <body style="font-family:sans-serif;padding:40px">
              <h1>Fatura #{{invoiceNumber}}</h1>
              <p><strong>Cliente:</strong> {{client.name}}</p>
              <p><strong>Total:</strong> R$ {{total}}</p>
            </body>
          </html>
        `;
      }

      const compiled = Handlebars.compile(templateContent);

      const html = compiled({
        invoiceNumber: invoice.number || 'SEM NÚMERO',
        client: {
          name: client.name || 'Cliente não informado',
          document: client.document || 'Não informado',
          address: client.address || 'Não informado',
          phone: client.phone || '-',
          vehicle: vehicleDetails,
          plate,
        },
        issueDate,
        dueDate,
        status,
        items,
        subtotal: subtotal.toFixed(2),
        issValue: issTotal.toFixed(2),
        total: total.toFixed(2),
        companyName,
        companyDocument,
        companyPhone,
        companyEmail,
        logoUrl,
      });

      // =========================
      // PUPPETEER
      // =========================
      const browser = await this.browserPool.getBrowser();

      page = await browser.newPage();

      await page.setViewport({
        width: 1240,
        height: 1754,
      });

      try {
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });
      } catch {
        this.logger.warn('⚠️ networkidle0 falhou, usando load');
        await page.setContent(html, {
          waitUntil: 'load',
          timeout: 30000,
        });
      }

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      });

      this.logger.log(`✅ PDF gerado com sucesso #${invoice.id}`);

      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error('❌ Erro ao gerar PDF da fatura', error);
      throw new InternalServerErrorException(
        'Erro ao gerar PDF da fatura',
      );
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          this.logger.warn('Erro ao fechar página Puppeteer');
        }
      }
    }
  }
}