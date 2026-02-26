#!/usr/bin/env node
/**
 * Simple test to verify chatbot connectivity
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

console.log('Testing RAG Backend connection...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const health = JSON.parse(data);
      console.log('✅ Backend is ONLINE');
      console.log(`   Status: ${health.status}`);
      console.log(`   Version: ${health.version}`);
      console.log(`   Documents: ${health.components?.documents_indexed || 'N/A'}`);
      console.log(`   Vector Store: ${health.components?.vector_store ? 'Ready' : 'Not Ready'}`);
      console.log('\n🎉 Chatbot should work correctly!');
    } else {
      console.log(`⚠️  Backend returned status ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Cannot connect to backend:');
  console.error(`   ${e.message}`);
  console.log('\n🔧 Make sure the backend is running:');
  console.log('   cd RAG && .\\venv\\Scripts\\python app.py');
});

req.on('timeout', () => {
  console.error('❌ Connection timed out');
  req.destroy();
});

req.end();
