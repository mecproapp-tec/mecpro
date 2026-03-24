import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para as origens permitidas
  app.enableCors({
    origin: [
      'https://mecpro.tec.br',
      'https://www.mecpro.tec.br',
      
      // 'https://mec-pro.vercel.app
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3000);
  console.log('🔥 SUBIU A API CORRETA 🔥');
}
bootstrap();