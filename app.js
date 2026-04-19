// app.js - Firebase Test Functions

import { addTestData, getTestData } from './firebase.js';

// Test buttons
document.getElementById('addDataBtn')?.addEventListener('click', async () => {
  try {
    const id = await addTestData();
    alert(`✅ Added test data! ID: ${id}`);
  } catch (error) {
    alert(`❌ Failed to add data: ${error.message}`);
  }
});

document.getElementById('getDataBtn')?.addEventListener('click', async () => {
  try {
    const data = await getTestData();
    console.table(data);
    alert(`✅ Fetched ${data.length} documents. Check console!`);
  } catch (error) {
    alert(`❌ Failed to get data: ${error.message}`);
  }
});

console.log('🚀 Firebase test app ready! Click buttons in HTML to test.');

// Auto-test on load (optional)
window.addEventListener('load', async () => {
  console.log('📱 Page loaded. Test functions ready.');
});
