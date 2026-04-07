import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

@Injectable()
export class BrowserPoolService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(BrowserPoolService.name);

  async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    this.logger.log('🚀 Iniciando Puppeteer...');

    const isWindows = os.platform() === 'win32';
    let executablePath: string | undefined;

    if (isWindows) {
      // Procura o Chromium baixado pelo puppeteer
      const baseDir = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
      if (fs.existsSync(baseDir)) {
        const folders = fs.readdirSync(baseDir).filter(f => f.startsWith('win64-'));
        if (folders.length > 0) {
          const latest = folders.sort().reverse()[0];
          const candidate = path.join(baseDir, latest, 'chrome-win64', 'chrome.exe');
          if (fs.existsSync(candidate)) {
            executablePath = candidate;
            this.logger.log(`📌 Chromium encontrado: ${executablePath}`);
          }
        }
      }
      if (!executablePath) {
        this.logger.warn('⚠️ Chromium não encontrado no cache. O Puppeteer tentará baixar automaticamente.');
      }
    } else {
      // Linux (Railway)
      const linuxPath = '/usr/bin/chromium';
      if (fs.existsSync(linuxPath)) {
        executablePath = linuxPath;
        this.logger.log(`📌 Usando Chromium do sistema: ${executablePath}`);
      }
    }

    this.browser = await puppeteer.launch({
      headless: true,
      ...(executablePath && { executablePath }),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    this.logger.log('✅ Puppeteer iniciado');
    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('🛑 Puppeteer finalizado');
    }
  }
}