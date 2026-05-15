// test-mp.js
const https = require('https');

const token = 'TEST-3160349642880268-042123-b5b2a401d153ad37f53865499f5ab323-3351636047';

const data = JSON.stringify({
  reason: "Teste MecPro",
  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: 149.90,
    currency_id: "BRL"
  },
  payer_email: "teste_" + Date.now() + "@exemplo.com",
  external_reference: "test_" + Date.now(),
  back_url: "http://localhost:5173/register?payment=success"
});

console.log('📤 Enviando requisição para Mercado Pago...\n');
console.log('Payload:', data);
console.log('');

const options = {
  hostname: 'api.mercadopago.com',
  path: '/preapproval',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers['content-type']);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📥 Resposta:');
    try {
      const json = JSON.parse(responseData);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.init_point || json.sandbox_init_point) {
        console.log('\n✅ SUCESSO! Link de pagamento gerado:');
        const link = json.sandbox_init_point || json.init_point;
        console.log(link);
      } else if (json.message) {
        console.log('\n❌ ERRO:', json.message);
        if (json.cause) {
          console.log('Causa:', json.cause);
        }
      }
    } catch (e) {
      console.log('Resposta bruta:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.write(data);
req.end();