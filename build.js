// Custom build script for Vercel
const { execSync } = require('child_process');

// Set environment variables
process.env.CI = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.GENERATE_SOURCEMAP = 'false';

console.log('Starting custom build...');
console.log('CI:', process.env.CI);
console.log('DISABLE_ESLINT_PLUGIN:', process.env.DISABLE_ESLINT_PLUGIN);

try {
  // Run the build
  execSync('npx react-scripts build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 