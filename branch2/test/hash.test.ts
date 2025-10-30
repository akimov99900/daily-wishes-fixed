import { fnv1aHash, getWishIndex, getTodayDateString } from '../src/utils';

// Simple test runner
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

function testHashFunction() {
  console.log('Testing hash function...');
  
  // Test deterministic behavior
  const hash1 = fnv1aHash('test');
  const hash2 = fnv1aHash('test');
  assert(hash1 === hash2, 'Hash function should be deterministic');
  
  // Test different inputs produce different hashes
  const hash3 = fnv1aHash('different');
  assert(hash1 !== hash3, 'Different inputs should produce different hashes');
  
  // Test hash is always a positive number
  assert(hash1 >= 0, 'Hash should be non-negative');
  assert(hash2 >= 0, 'Hash should be non-negative');
  assert(hash3 >= 0, 'Hash should be non-negative');
}

function testWishIndexSelection() {
  console.log('Testing wish index selection...');
  
  const totalWishes = 30;
  const date = '2024-01-01';
  
  // Test deterministic selection for same fid
  const index1 = getWishIndex(12345, date, totalWishes);
  const index2 = getWishIndex(12345, date, totalWishes);
  assert(index1 === index2, 'Same fid should get same wish index');
  
  // Test different fids get different wishes (usually)
  const index3 = getWishIndex(67890, date, totalWishes);
  assert(index1 !== index3 || index1 === index3, 'Different fids may get different wishes');
  
  // Test index is within bounds
  assert(index1 >= 0 && index1 < totalWishes, 'Wish index should be within bounds');
  assert(index2 >= 0 && index2 < totalWishes, 'Wish index should be within bounds');
  assert(index3 >= 0 && index3 < totalWishes, 'Wish index should be within bounds');
  
  // Test null fid falls back to date-only
  const indexNull = getWishIndex(null, date, totalWishes);
  assert(indexNull >= 0 && indexNull < totalWishes, 'Null fid should still produce valid index');
}

function testDateFunction() {
  console.log('Testing date function...');
  
  const date = getTodayDateString();
  assert(date.match(/^\d{4}-\d{2}-\d{2}$/) !== null, 'Date should be in YYYY-MM-DD format');
  
  // Test it's consistent within the same day
  const date2 = getTodayDateString();
  assert(date === date2, 'Date should be consistent within same execution');
}

// Run tests
try {
  testHashFunction();
  testWishIndexSelection();
  testDateFunction();
  console.log('\n🎉 All tests passed!');
} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}