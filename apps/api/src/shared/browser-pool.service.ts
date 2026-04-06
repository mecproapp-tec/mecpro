import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import chromium from '@sparticuz/chromium';

@Injectable()
export class BrowserPoolService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(BrowserPoolService.name);

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.logger.log('🚀 Iniciando Puppeteer...');

      const isProd = process.env.NODE_ENV === 'production';

      this.browser = await puppeteer.launch({
        args: isProd
          ? chromium.args
          : ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: isProd
          ? await chromium.executablePath()
          : undefined,
        headless: true,
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