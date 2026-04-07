// apps/api/src/modules/invoices/invoices-pdf.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BrowserPoolService } from '../../shared/browser-pool.service';

@Injectable()
export class InvoicesPdfService {
  private readonly logger = new Logger(InvoicesPdfService.name);

  constructor(private readonly browserPool: BrowserPoolService) {}

  async generateInvoicePdf(invoice: any, tenant: any): Promise<Buffer> {
    if (!invoice) throw new InternalServerErrorException('Dados inválidos');

    this.logger.log(`📄 Gerando PDF da fatura #${invoice.id}`);

    let page: any;
    try {
      // Template com fallback para produção
      const distPath = path.resolve(process.cwd(), 'dist/modules/invoices/invoice-pdf.hbs');
      const srcPath = path.resolve(process.cwd(), 'src/modules/invoices/invoice-pdf.hbs');
      const templatePath = existsSync(distPath) ? distPath : srcPath;

      let templateContent: string;
      try {
        templateContent = readFileSync(templatePath, 'utf-8');
      } catch {
        this.logger.warn('Template não encontrado, usando fallback embutido');
        templateContent = `<html><body><h1>Fatura {{invoiceNumber}}</h1><p>Total: R$ {{total}}</p></body></html>`;
      }

      const compiled = Handlebars.compile(templateContent);

      // ... (seus dados de normalização permanecem iguais) ...
      // (cálculo de items, client, etc – igual ao seu código original)

      const html = compiled({
        invoiceNumber: invoice.number,
        client: { name: invoice.client?.name || 'Cliente' },
        total: invoice.total,
        // ... inclua todos os campos que você já usava
      });

      const browser = await this.browserPool.getBrowser();
      page = await browser.newPage();
      await page.setViewport({ width: 1240, height: 1754 });
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });

      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error('Erro ao gerar PDF', error);
      throw new InternalServerErrorException('Erro ao gerar PDF');
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
}