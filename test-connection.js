const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();