#!/usr/bin/env node

/**
 * Test script to verify import path resolution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Import Path Resolution...\n');

// Test if files exist
const testFiles = [
  'src/components/ErrorBoundary.tsx',
  'src/components/RouteErrorBoundary.tsx',
  'src/pages/HomePage.tsx',
  'src/lib/aptos.ts',
  'src/abis/index.ts'
];

console.log('📁 Checking file existence:');
testFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Test TypeScript config
console.log('\n📝 Checking TypeScript configuration:');
const tsconfigPath = path.join(__dirname, 'tsconfig.app.json');
if (fs.existsSync(tsconfigPath)) {
  console.log('  ✅ tsconfig.app.json exists');
  const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
  console.log('  📍 Has baseUrl:', tsconfigContent.includes('"baseUrl"'));
  console.log('  📍 Has paths:', tsconfigContent.includes('"paths"'));
  console.log('  📍 Has @/* alias:', tsconfigContent.includes('"@/*"'));
} else {
  console.log('  ❌ tsconfig.app.json not found');
}

// Test Vite config
console.log('\n⚡ Checking Vite configuration:');
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  console.log('  ✅ vite.config.ts exists');
  console.log('  📍 Has resolve.alias:', viteConfig.includes('resolve:') && viteConfig.includes('alias:'));
} else {
  console.log('  ❌ vite.config.ts not found');
}

console.log('\n🎉 Import path resolution test complete!');
