const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src/modules/pdf/templates');
const dest = path.join(__dirname, 'dist/modules/pdf/templates');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

fs.readdirSync(src).forEach(file => {
  fs.copyFileSync(
    path.join(src, file),
    path.join(dest, file)
  );
});

console.log('✅ Templates copiados para dist!');