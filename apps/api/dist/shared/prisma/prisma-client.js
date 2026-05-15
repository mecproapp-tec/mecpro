"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:Vasco@2026@localhost:5432/mecpro?schema=public";
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
}
exports.prisma = new client_1.PrismaClient();
//# sourceMappingURL=prisma-client.js.map