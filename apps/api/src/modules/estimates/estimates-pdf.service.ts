import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

@Injectable()
export class EstimatesPdfService {
  private readonly logger = new Logger(EstimatesPdfService.name);
  private templateCache: HandlebarsTemplateDelegate | null = null;

  private async getBrowser() {
    const chromePath =
      process.env.CHROME_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    try {
      if (fs.existsSync(chromePath)) {
        this.logger.log(`✅ Usando Chrome: ${chromePath}`);
        return await puppeteer.launch({
          executablePath: chromePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true,
        });
      }

      const altPath =
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
      if (fs.existsSync(altPath)) {
        this.logger.log(`✅ Usando Chrome alternativo`);
        return await puppeteer.launch({
          executablePath: altPath,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true,
        });
      }

      this.logger.warn('⚠️ Chrome não encontrado, usando Chromium padrão');
      return await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      });
    } catch (error) {
      this.logger.error('Erro ao iniciar browser', error);
      throw new InternalServerErrorException('Erro ao iniciar navegador PDF');
    }
  }

  private loadTemplate(): HandlebarsTemplateDelegate {
    if (this.templateCache) return this.templateCache;

    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'modules', 'estimates', 'estimates-pdf.hbs'),
      path.join(process.cwd(), 'src', 'modules', 'estimates', 'estimates-pdf.hbs'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.logger.log(`📄 Template encontrado em: ${p}`);
        const html = fs.readFileSync(p, 'utf-8');
        this.templateCache = Handlebars.compile(html);
        return this.templateCache;
      }
    }

    this.logger.error('❌ Template não encontrado');
    throw new InternalServerErrorException('Template de orçamento não encontrado');
  }

  async generateEstimatePdf(estimate: any): Promise<Buffer> {
    let browser = null;

    try {
      if (!estimate) {
        throw new InternalServerErrorException('Dados inválidos para PDF');
      }

      const template = this.loadTemplate();

      let subtotal = 0;
      let totalIss = 0;

      const items = (estimate.items || []).map((item: any) => {
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const issPercent = Number(item.issPercent) || 0;

        const subtotalItem = quantity * price;
        const issValue = subtotalItem * (issPercent / 100);
        const totalWithIss = subtotalItem + issValue;

        subtotal += subtotalItem;
        totalIss += issValue;

        return {
          description: item.description || '-',
          quantity,
          unitPrice: price.toFixed(2),
          issPercent: issPercent.toFixed(1),
          issValue: issValue.toFixed(2),
          totalWithIss: totalWithIss.toFixed(2),
        };
      });

      const total = subtotal + totalIss;

      const html = template({
        estimateNumber: estimate.id,
        client: {
          name: estimate.client?.name || 'Cliente não informado',
          phone: estimate.client?.phone || '-',
          vehicle: estimate.client?.vehicle || '-',
          plate: estimate.client?.plate || '-',
          document: estimate.client?.document || '-',
          address: estimate.client?.address || '-',
        },
        items,
        subtotal: subtotal.toFixed(2),
        totalIss: totalIss.toFixed(2),
        total: total.toFixed(2),
        companyName: estimate.tenant?.name || 'MecPro',
        companyDocument: estimate.tenant?.documentNumber || 'CNPJ: --',
        companyPhone: estimate.tenant?.phone || '(11) 99999-9999',
        companyEmail: estimate.tenant?.email || 'contato@mecpro.com.br',
        companyAddress: estimate.tenant?.address || '',
        companyLogo: estimate.tenant?.logoUrl || '',
        issueDate: new Date().toLocaleDateString('pt-BR'),
        validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR'),
      });

      this.logger.log(`🧾 Gerando PDF orçamento ${estimate.id}`);

      browser = await this.getBrowser();
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      });

      this.logger.log(`✅ PDF gerado (${pdf.length} bytes)`);
      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao gerar PDF orçamento ${estimate?.id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Erro ao gerar PDF: ${error.message}`,
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}