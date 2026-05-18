"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require(".././app.module");
const common_1 = require("@nestjs/common");
async function bootstrapWorker() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const logger = new common_1.Logger('Worker');
    logger.log('🚀 Worker iniciado');
    logger.log('⏰ Jobs agendados ativos:');
    logger.log('   - Expiração de trials (diário)');
    logger.log('   - Limpeza de sessões (hora)');
    logger.log('   - Lembretes de pagamento (diário)');
    process.on('SIGTERM', async () => {
        logger.log('🛑 Recebido SIGTERM, fechando worker...');
        await app.close();
        process.exit(0);
    });
}
bootstrapWorker().catch((err) => {
    console.error('❌ Erro no worker:', err);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map