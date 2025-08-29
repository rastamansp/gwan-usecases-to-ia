#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Formatando arquivos do projeto...');

try {
  // Executar Prettier em todos os arquivos
  console.log('📝 Executando Prettier...');
  execSync('npx prettier --write "src/**/*.{ts,js}" "test/**/*.{ts,js}" "*.{json,md,yml,yaml}"', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Executar ESLint com --fix
  console.log('🔍 Executando ESLint com --fix...');
  execSync('npx eslint "src/**/*.{ts,js}" "test/**/*.{ts,js}" --fix', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Formatação concluída com sucesso!');
} catch (error) {
  console.error('❌ Erro durante a formatação:', error.message);
  process.exit(1);
}
