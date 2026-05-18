import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class InvoicesPdfService {
  private readonly logger = new Logger(InvoicesPdfService.name);
  private templateCache: HandlebarsTemplateDelegate | null = null;

  constructor(private readonly storageService: StorageService) {}

  private async getBrowser() {
    const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    if (fs.existsSync(chromePath)) {
      this.logger.log(`Usando Chrome: ${chromePath}`);
      return puppeteer.launch({
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true,
      });
    }
    const altPath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    if (fs.existsSync(altPath)) {
      this.logger.log(`Usando Chrome alternativo: ${altPath}`);
      return puppeteer.launch({
        executablePath: altPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true,
      });
    }
    this.logger.warn('Chrome não encontrado, tentando Chromium padrão...');
    return puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
  }

  private loadTemplate(): HandlebarsTemplateDelegate {
    if (this.templateCache) return this.templateCache;
    
    const possiblePaths = [
      path.join(__dirname, 'templates', 'invoice-pdf.hbs'),
      path.join(__dirname, 'invoice-pdf.hbs'),
      path.join(process.cwd(), 'dist', 'modules', 'invoices', 'templates', 'invoice-pdf.hbs'),
      path.join(process.cwd(), 'src', 'modules', 'invoices', 'templates', 'invoice-pdf.hbs'),
    ];
    
    let templatePath: string | null = null;
    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        templatePath = tryPath;
        this.logger.log(`Template encontrado em: ${tryPath}`);
        break;
      }
    }
    
    if (!templatePath) {
      throw new Error('Template de fatura não encontrado');
    }
    
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');
    this.templateCache = Handlebars.compile(templateHtml);
    return this.templateCache;
  }

  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    if (!invoice) throw new InternalServerErrorException('Dados inválidos para gerar PDF');
    
    let browser = null;
    try {
      const compiledTemplate = this.loadTemplate();
      const client = invoice.client || {};
      const tenant = invoice.tenant || {};
      
      let subtotal = 0;
      let totalIss = 0;
      
      // Calcular itens com ISS
      const items = (invoice.items || []).map((item: any) => {
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const issPercent = Number(item.issPercent) || 0;
        
        const subtotalItem = quantity * price;
        const issValue = subtotalItem * (issPercent / 100);
        const totalWithIss = subtotalItem + issValue;
        
        subtotal += subtotalItem;
        totalIss += issValue;
        
        this.logger.debug(`Item: ${item.description}, Subtotal: ${subtotalItem}, ISS: ${issValue}, Total: ${totalWithIss}`);
        
        return {
          description: item.description || '-',
          quantity: quantity,
          unitPrice: price.toFixed(2),
          issPercent: issPercent.toFixed(1),
          issValue: issValue.toFixed(2),
          totalWithIss: totalWithIss.toFixed(2),
        };
      });
      
      const total = subtotal + totalIss;
      
      const issueDateObj = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date(Date.now() + 30 * 86400000);
      
      this.logger.log(`Fatura ${invoice.id}: Subtotal=${subtotal.toFixed(2)}, TotalISS=${totalIss.toFixed(2)}, TotalGeral=${total.toFixed(2)}`);
      
      const html = compiledTemplate({
        invoiceNumber: invoice.number || invoice.id,
        client: {
          name: client.name || 'Cliente não informado',
          phone: client.phone || '-',
          vehicle: client.vehicle || '-',
          plate: client.plate || '-',
          document: client.document || '-',
          address: client.address || '-',
        },
        items,
        subtotal: subtotal.toFixed(2),
        totalIss: totalIss.toFixed(2),
        total: total.toFixed(2),
        companyName: tenant.name || 'MecPro',
        companyDocument: tenant.documentNumber || 'CNPJ: --',
        companyPhone: tenant.phone || '(11) 99999-9999',
        companyEmail: tenant.email || 'contato@mecpro.com.br',
        companyAddress: tenant.address || '',
        companyLogo: tenant.logoUrl || '',
        issueDate: issueDateObj.toLocaleDateString('pt-BR'),
        dueDate: dueDate.toLocaleDateString('pt-BR'),
      });
      
      this.logger.log(`Gerando PDF para fatura ${invoice.id} (${items.length} itens)`);
      
      browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setContent(html, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { 
          top: '20px', 
          bottom: '20px', 
          left: '20px', 
          right: '20px' 
        },
      });
      
      const pdfBuffer = Buffer.from(pdf);
      const tenantId = invoice.tenant?.id || invoice.tenantId || 'unknown';
      const key = `tenants/${tenantId}/invoices/invoice_${invoice.number || invoice.id}.pdf`;
      
      await this.storageService.uploadPdf(pdfBuffer, key, tenantId);
      this.logger.log(`PDF salvo no R2: ${key}`);
      
      return pdfBuffer;
      
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF para fatura ${invoice?.id}`, error);
      throw new InternalServerErrorException(`Erro ao gerar PDF: ${error.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }
}