import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class BrowserPoolService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(BrowserPoolService.name);

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.logger.log('🚀 Iniciando Puppeteer...');

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      });

      this.logger.log('✅ Puppeteer iniciado');
    }

    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('🛑 Puppeteer finalizado');
    }
  }
}