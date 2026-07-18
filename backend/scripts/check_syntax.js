const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', 'src');
let hadError = false;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && full.endsWith('.js')) {
      const code = fs.readFileSync(full, 'utf8');
      try {
        new vm.Script(code, { filename: full });
        console.log('OK ', path.relative(process.cwd(), full));
      } catch (e) {
        hadError = true;
        console.error('ERR', path.relative(process.cwd(), full), '-', e.message);
      }
    }
  }
}

walk(root);
if (hadError) process.exit(2);
else process.exit(0);
