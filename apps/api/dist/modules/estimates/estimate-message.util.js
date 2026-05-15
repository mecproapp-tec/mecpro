"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEstimateMessage = buildEstimateMessage;
function buildEstimateMessage(estimate, pdfUrl) {
    const title = `Orçamento #${estimate.id}`;
    const text = `📄 ${title}

👤 Cliente: ${estimate.client?.name || '-'}

💰 Total: R$ ${Number(estimate.total).toFixed(2)}

${pdfUrl ? `👉 Acesse o PDF:\n${pdfUrl}\n` : ''}

Obrigado pela preferência!
MecPro`;
    return {
        title,
        text,
        encoded: encodeURIComponent(text),
    };
}
//# sourceMappingURL=estimate-message.util.js.map