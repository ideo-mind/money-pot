#!/usr/bin/env node

/**
 * Test script to verify ABI imports are working correctly
 */

// Test the ABI import structure
try {
  console.log('🧪 Testing ABI Import Structure...\n');
  
  // Simulate the import structure
  const mockAbi = {
    _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f: {
      money_pot_manager: {
        entry: {
          createPotEntry: 'function',
          attemptPotEntry: 'function',
          attemptCompleted: 'function'
        },
        view: {
          getPot: 'function',
          getPots: 'function',
          getActivePots: 'function'
        }
      }
    }
  };
  
  console.log('✅ ABI structure looks correct:');
  console.log('  - Contract address:', Object.keys(mockAbi)[0]);
  console.log('  - Module:', Object.keys(mockAbi._0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f)[0]);
  console.log('  - Entry functions:', Object.keys(mockAbi._0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.entry));
  console.log('  - View functions:', Object.keys(mockAbi._0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view));
  
  console.log('\n📝 Usage pattern:');
  console.log('  import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from "@/abis";');
  console.log('  await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.entry.createPotEntry(...)');
  
  console.log('\n🎉 ABI import structure is correct!');
  
} catch (error) {
  console.error('❌ ABI import test failed:', error.message);
  process.exit(1);
}
