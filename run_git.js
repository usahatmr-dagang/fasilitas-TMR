const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('git add . && git commit -m "Fix duplicate X icon" && git push origin main', { cwd: 'c:/Users/user/.gemini/antigravity-ide/scratch/sistem-informasi-ragunan', encoding: 'utf-8' });
  fs.writeFileSync('c:/Users/user/.gemini/antigravity-ide/scratch/sistem-informasi-ragunan/git_output.txt', out);
} catch (e) {
  fs.writeFileSync('c:/Users/user/.gemini/antigravity-ide/scratch/sistem-informasi-ragunan/git_output.txt', e.stdout + '\n' + e.stderr + '\n' + e.message);
}
