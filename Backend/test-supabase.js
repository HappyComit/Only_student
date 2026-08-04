require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { supabase } = require('./config/supabase');

const prisma = new PrismaClient();

async function testSupabase() {
  console.log('🔍 Testing Supabase Cloud Integration...');

  // 1. Test PostgreSQL Database connection via Prisma
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Supabase PostgreSQL Database connected! Current User Count: ${userCount}`);
  } catch (err) {
    console.error('❌ Supabase PostgreSQL Database error:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Test Supabase Storage credentials
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn('⚠️ Supabase Storage check warning:', error.message);
    } else {
      console.log(`✅ Supabase Storage connected! Active Buckets:`, buckets ? buckets.map(b => b.name) : []);
    }
  } catch (err) {
    console.error('❌ Supabase Storage error:', err.message);
  }

  console.log('🎉 Supabase test completed.');
}

testSupabase();
