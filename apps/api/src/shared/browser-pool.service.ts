import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

@Injectable()
export class BrowserPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserPoolService.name);
  private browser: puppeteer.Browser | null = null;
  private isLaunching = false;

  async getBrowser(): Promise<puppeteer.Browser> {
    if (this.browser) return this.browser;

    if (this.isLaunching) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return this.getBrowser();
    }

    this.isLaunching = true;

    try {
      const executablePath = await chromium.executablePath;

      this.browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
      });

      this.logger.log('Browser launched (Vercel)');
      return this.browser;
    } catch (error) {
      this.logger.error('Erro ao iniciar Puppeteer', error);
      throw error;
    } finally {
      this.isLaunching = false;
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }
}