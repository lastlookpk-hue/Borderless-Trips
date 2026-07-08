const { execSync } = require('child_process');

console.log('📦 Starting Borderless Trips Monorepo Build Process...');

function run(cmd) {
  console.log(`\n🏃 Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // 1. Install client dependencies (forces devDependencies for Vite)
  run('npm install --production=false --include=dev --prefix client');
  
  // 2. Install server dependencies (including nodemailer)
  run('npm install --prefix server');
  
  // 3. Build the Vite frontend application
  run('npm run build --prefix client');
  
  console.log('\n✅ Build Process Completed Successfully!');
} catch (error) {
  console.error('\n❌ Build Process Failed:', error.message);
  process.exit(1);
}
