import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import puppeteer from 'puppeteer';

@Injectable()
export class InvoicesPdfService {
  async generateInvoicePdf(invoice: any, tenant: any): Promise<Buffer> {
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

    const templatePath = path.join(__dirname, 'invoice-pdf.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateContent);

    const data = {
      invoiceNumber: invoice.number,
      client: {
        name: client.name,
        document: client.document || 'Não informado',
        address: client.address || '',
        phone: client.phone,
        vehicle: vehicleDetails,
        plate: plate,
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

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    return Buffer.from(pdfUint8);
  }

  private getStatusText(status: string): string {
    const map = {
      PAID: 'Paga',
      PENDING: 'Pendente',
      CANCELED: 'Cancelada',
    };
    return map[status] || 'Desconhecido';
  }
}