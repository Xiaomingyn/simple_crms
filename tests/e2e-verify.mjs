import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5173';
const PAGES = [
  { name: 'Dashboard', path: '/', checks: ['Dashboard', 'ACTIVE DEALS', 'WON DEALS', 'REVENUE', 'OPEN TASKS', 'Recent Activity'] },
  { name: 'Organizations', path: '/organizations', checks: ['Organizations', 'Acme Corporation', 'Globex Inc.', 'Stark Industries', 'Wayne Enterprises'] },
  { name: 'Contacts', path: '/contacts', checks: ['Contacts', 'John Smith', 'Jane Doe', 'Tony Stark', 'Lead', 'Customer'] },
  { name: 'Deals', path: '/deals', checks: ['Deals', 'Manufacturing', 'Cloud Migration', 'Defense Analytics'] },
  { name: 'Pipeline', path: '/pipeline', checks: ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'Lab Management Platform', 'Defense Analytics Engine'] },
];

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  executablePath: '/home/node/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome',
});

const page = await browser.newPage();
page.setViewport({ width: 1280, height: 900 });

let allPassed = true;
const consoleErrors = [];

page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning') consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
});

page.on('pageerror', err => {
  consoleErrors.push(`[PAGE ERROR] ${err.message}`);
});

for (const { name, path, checks } of PAGES) {
  console.log(`\n=== ${name} (${BASE}${path}) ===`);
  
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const title = await page.title();
    console.log(`  Title: "${title}"`);
    if (title !== 'Personal CRM') {
      console.log('  ⚠ Title mismatch');
    }
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    for (const check of checks) {
      const found = bodyText.includes(check);
      console.log(`  ${found ? '✓' : '✗'} Contains: "${check}"`);
      if (!found) allPassed = false;
    }
    
    await page.screenshot({ path: `/tmp/crm-${name.toLowerCase()}.png`, fullPage: false });
    
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    allPassed = false;
  }
}

if (consoleErrors.length > 0) {
  console.log(`\n⚠ Console messages (${consoleErrors.length}):`);
  for (const err of consoleErrors.slice(0, 10)) {
    console.log(`  ${err}`);
  }
  // Only fail on actual page errors, not benign warnings
  const realErrors = consoleErrors.filter(e => e.includes('[PAGE ERROR]') || e.includes('[error] HTTP'));
  if (realErrors.length > 0) allPassed = false;
} else {
  console.log('\n✓ No console errors');
}

// CRUD API Tests
console.log('\n=== CRUD API Tests ===');

// Create org
const createResp = await fetch('http://localhost:3001/api/organizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Org', website: 'https://test.org', industry: 'Testing' }),
});
const created = await createResp.json();
console.log(`${createResp.ok ? '✓' : '✗'} Created org: ${created.name}`);
allPassed = allPassed && createResp.ok;

// Update org
const updateResp = await fetch(`http://localhost:3001/api/organizations/${created.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated Org' }),
});
const updated = await updateResp.json();
console.log(`${updateResp.ok && updated.name === 'Updated Org' ? '✓' : '✗'} Updated org`);
allPassed = allPassed && updateResp.ok && updated.name === 'Updated Org';

// Delete org
const delResp = await fetch(`http://localhost:3001/api/organizations/${created.id}`, { method: 'DELETE' });
const deleted = await delResp.json();
console.log(`${delResp.ok && deleted.success ? '✓' : '✗'} Deleted org`);
allPassed = allPassed && delResp.ok && deleted.success;

// Create contact
const createContactResp = await fetch('http://localhost:3001/api/contacts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Contact', email: 'test@example.com', status: 'lead' }),
});
const createdContact = await createContactResp.json();
console.log(`${createContactResp.ok ? '✓' : '✗'} Created contact: ${createdContact.name}`);
allPassed = allPassed && createContactResp.ok;

// Update contact
const updateContactResp = await fetch(`http://localhost:3001/api/contacts/${createdContact.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated Contact', status: 'customer' }),
});
const updatedContact = await updateContactResp.json();
console.log(`${updateContactResp.ok && updatedContact.status === 'customer' ? '✓' : '✗'} Updated contact status to customer`);
allPassed = allPassed && updateContactResp.ok && updatedContact.status === 'customer';

// Delete contact
const delContactResp = await fetch(`http://localhost:3001/api/contacts/${createdContact.id}`, { method: 'DELETE' });
console.log(`${delContactResp.ok ? '✓' : '✗'} Deleted contact`);
allPassed = allPassed && delContactResp.ok;

// Deal stage change
const dealsResp = await fetch('http://localhost:3001/api/deals');
const deals = await dealsResp.json();
if (deals.length > 0) {
  const deal = deals[0];
  const origStage = deal.stage;
  const patchResp = await fetch(`http://localhost:3001/api/deals/${deal.id}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'won' }),
  });
  const patched = await patchResp.json();
  console.log(`${patchResp.ok && patched.stage === 'won' ? '✓' : '✗'} Changed deal "${deal.name}" to Won`);
  allPassed = allPassed && patchResp.ok && patched.stage === 'won';
  
  // Test Lost too
  const patchLostResp = await fetch(`http://localhost:3001/api/deals/${deal.id}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'lost' }),
  });
  const patchedLost = await patchLostResp.json();
  console.log(`${patchLostResp.ok && patchedLost.stage === 'lost' ? '✓' : '✗'} Changed deal to Lost`);
  allPassed = allPassed && patchLostResp.ok && patchedLost.stage === 'lost';
  
  // Restore
  await fetch(`http://localhost:3001/api/deals/${deal.id}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: origStage }),
  });
}

// Activity create + toggle
const contactsResp = await fetch('http://localhost:3001/api/contacts');
const contacts = await contactsResp.json();
if (contacts.length > 0) {
  const contact = contacts[0];
  const actResp = await fetch('http://localhost:3001/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      type: 'note', 
      contact_id: contact.id, 
      description: 'E2E test activity',
      due_date: '2026-08-01',
      done: false,
    }),
  });
  const activity = await actResp.json();
  console.log(`${actResp.ok && activity.type === 'note' ? '✓' : '✗'} Created ${activity.type} activity for ${contact.name}`);
  allPassed = allPassed && actResp.ok;
  
  const toggleResp = await fetch(`http://localhost:3001/api/activities/${activity.id}/toggle`, { method: 'PATCH' });
  const toggled = await toggleResp.json();
  console.log(`${toggleResp.ok && toggled.done === 1 ? '✓' : '✗'} Toggled activity done → ${toggled.done}`);
  allPassed = allPassed && toggleResp.ok && toggled.done === 1;
  
  const toggleBackResp = await fetch(`http://localhost:3001/api/activities/${activity.id}/toggle`, { method: 'PATCH' });
  const toggledBack = await toggleBackResp.json();
  console.log(`${toggleBackResp.ok && toggledBack.done === 0 ? '✓' : '✗'} Toggled activity back → ${toggledBack.done}`);
  allPassed = allPassed && toggleBackResp.ok && toggledBack.done === 0;
}

// Search
const searchResp = await fetch('http://localhost:3001/api/contacts?search=john');
const searchResults = await searchResp.json();
console.log(`${searchResp.ok && searchResults.length > 0 ? '✓' : '✗'} Search "john" returned ${searchResults.length} contacts`);
allPassed = allPassed && searchResp.ok && searchResults.length > 0;

// Filter
const filterResp = await fetch('http://localhost:3001/api/contacts?status=customer');
const filterResults = await filterResp.json();
console.log(`${filterResp.ok && filterResults.length > 0 ? '✓' : '✗'} Filter customer returned ${filterResults.length} contacts`);
allPassed = allPassed && filterResp.ok && filterResults.length > 0;

// Dashboard data
const dashResp = await fetch('http://localhost:3001/api/dashboard');
const dashData = await dashResp.json();
const dashOk = dashResp.ok && dashData.summary.totalDeals > 0 && dashData.wonByMonth.length > 0;
console.log(`${dashOk ? '✓' : '✗'} Dashboard: ${dashData.summary.totalDeals} deals, ${dashData.summary.wonDeals} won, $${dashData.summary.totalRevenue} revenue, ${dashData.recentActivity.length} activities, ${dashData.tasks.length} tasks`);
allPassed = allPassed && dashOk;

// Detail pages
const orgDetailResp = await fetch('http://localhost:3001/api/organizations?search=Acme');
const orgDetailResults = await orgDetailResp.json();
if (orgDetailResults.length > 0) {
  const detailResp = await fetch(`http://localhost:3001/api/organizations/${orgDetailResults[0].id}`);
  const detail = await detailResp.json();
  console.log(`${detailResp.ok && detail.contacts && detail.deals ? '✓' : '✗'} Organization detail has ${detail.contacts?.length || 0} contacts, ${detail.deals?.length || 0} deals`);
  allPassed = allPassed && detailResp.ok && detail.contacts;
}

const contactDetailResp = await fetch('http://localhost:3001/api/contacts?search=Jane');
const contactDetailResults = await contactDetailResp.json();
if (contactDetailResults.length > 0) {
  const detailResp = await fetch(`http://localhost:3001/api/contacts/${contactDetailResults[0].id}`);
  const detail = await detailResp.json();
  console.log(`${detailResp.ok && detail.activities ? '✓' : '✗'} Contact detail has ${detail.activities?.length || 0} activities`);
  allPassed = allPassed && detailResp.ok && detail.activities;
}

await browser.close();

console.log(`\n${'='.repeat(50)}`);
if (allPassed) {
  console.log('✅ ALL E2E VERIFICATIONS PASSED');
} else {
  console.log('❌ SOME VERIFICATIONS FAILED');
}

process.exit(allPassed ? 0 : 1);
