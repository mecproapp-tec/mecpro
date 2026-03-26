import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private template: HandlebarsTemplateDelegate;

  constructor() {
    const templatePath = path.join(__dirname, 'templates', 'pdf-template.html');
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
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    await browser.close();
    return Buffer.from(pdfBuffer); // converte Uint8Array para Buffer
  }
}