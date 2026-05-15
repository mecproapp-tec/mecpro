// apps/api/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      message: 'API MecPro Online ✅',
      timestamp: new Date().toISOString(),
    };
  }
}
