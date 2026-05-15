// test-mp2.js
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

console.log('📤 Payload enviado:\n', data);
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
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📥 RESPOSTA COMPLETA:');
    console.log(responseData);
    console.log('');
    
    try {
      const json = JSON.parse(responseData);
      console.log('📋 Parseado:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.cause) {
        console.log('\n🔍 Causa do erro:');
        json.cause.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.description || c.message}`);
        });
      }
    } catch (e) {
      console.log('Não foi possível parsear a resposta.');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.write(data);
req.end();