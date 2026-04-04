import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private template: HandlebarsTemplateDelegate;

  constructor() {
    // 🔥 fallback automático (PROFISSIONAL)
    const distPath = join(
      process.cwd(),
      'dist/modules/pdf/templates/pdf-template.html',
    );

    const srcPath = join(
      process.cwd(),
      'src/modules/pdf/templates/pdf-template.html',
    );

    const templatePath = fs.existsSync(distPath) ? distPath : srcPath;

    this.logger.log(`📄 Template usado: ${templatePath}`);

    if (!fs.existsSync(templatePath)) {
      this.logger.error(`❌ Template NÃO encontrado`);
      throw new Error('PDF template não encontrado');
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    this.template = handlebars.compile(templateContent);
  }

  async generateFromData(data: any): Promise<Buffer> {
    const html = this.template(data);
    return this.generateFromHtml(html);
  }

  async generateFromHtml(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }
}