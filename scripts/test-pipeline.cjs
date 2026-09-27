const http = require('http');

function test(name, path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'preview-user',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch(e) { parsed = data.slice(0, 100); }
        resolve({ name, status: res.statusCode, data: parsed });
      });
    });
    req.on('error', (err) => resolve({ name, error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSuite() {
  console.log('=== BID EXACT FULL SYSTEM PIPELINE AUDIT ===');
  
  const results = [];
  
  // 1. Health
  results.push(await test('1. Health Check Endpoint', '/api/health'));

  // 2. Finance - Account listings
  results.push(await test('2. Finance Accounts Listing', '/api/finance/accounts'));

  // 3. Finance - Inflow / Outflow Transactions
  results.push(await test('3. Finance Transactions History', '/api/finance/transactions'));

  // 4. Finance - Create Income Transaction (Client deposit)
  results.push(await test('4. Record Client Inflow ($25,000)', '/api/finance/transactions', 'POST', {
    accountId: 1,
    amount: 25000,
    type: 'income',
    description: 'Milestone 1 Payment - Turner Construction Tower',
    scope: 'company'
  }));

  // 5. Finance - Create Outflow Transaction (Subcontractor / Contractor payout)
  results.push(await test('5. Record Partner / Expense Outflow ($7,500)', '/api/finance/transactions', 'POST', {
    accountId: 1,
    amount: 7500,
    type: 'expense',
    description: 'Outsourced Structural PE Stamping Fee',
    scope: 'company'
  }));

  // 6. Portal Entities (Intake requests & Quotes)
  results.push(await test('6. Portal Entities List', '/api/portal/entities'));

  // 7. Portal Entity Creation (New Project Intake Request from Client)
  results.push(await test('7. Client Portal Intake Request', '/api/portal/entities', 'POST', {
    entityType: 'project_intake',
    name: 'Metropolitan Logistics Center Phase II',
    status: 'submitted',
    data: {
      client: 'Skanska USA',
      scope: 'Structural Concrete & Steel QTO',
      targetDeadline: '2026-10-15',
      budget: 185000
    }
  }));

  // 8. Workspace - Reminders
  results.push(await test('8. Workspace Reminders Sync', '/api/workspace/reminders'));

  // 9. Workspace - Notifications
  results.push(await test('9. Notifications Inbox Sync', '/api/workspace/notifications'));

  // 10. Workspace - Employees
  results.push(await test('10. Employee Directory Sync', '/api/workspace/employees'));

  // 11. Workspace - Clients
  results.push(await test('11. Clients Master Sync', '/api/workspace/clients'));

  // 12. Workspace - Projects
  results.push(await test('12. Projects Catalog Sync', '/api/workspace/projects'));

  console.log('\n--- Test Results Summary ---');
  let passed = 0;
  for (const r of results) {
    const isOk = r.status >= 200 && r.status < 300;
    if (isOk) passed++;
    console.log((isOk ? 'PASS' : 'FAIL') + ' [' + (r.status || 'ERR') + '] ' + r.name);
    if (!isOk) console.log('   Error details:', r.data || r.error);
  }
  console.log('\nVerification Score: ' + passed + '/' + results.length + ' test cases passed.');
  process.exit(passed === results.length ? 0 : 1);
}

runSuite();
