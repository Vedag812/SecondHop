const BASE = 'https://secondhop.vercel.app';

async function testEndpoint(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = (await res.text()).slice(0, 200);
    }
    console.log(`[${res.status}] ${url} (${contentType})`);
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error(`[ERROR] ${url}:`, err.message);
    return { ok: false, error: err.message };
  }
}

async function run() {
  console.log('--- Testing Deployed Routes on SecondHop ---');
  await testEndpoint(`${BASE}/`);
  await testEndpoint(`${BASE}/dashboard`);
  await testEndpoint(`${BASE}/dashboard/agentic`);
  await testEndpoint(`${BASE}/dashboard/products`);
  await testEndpoint(`${BASE}/dashboard/analytics`);
  await testEndpoint(`${BASE}/dashboard/transactions`);
  await testEndpoint(`${BASE}/api/health`);
  await testEndpoint(`${BASE}/api/agent/manifest`);
  await testEndpoint(`${BASE}/.well-known/agent-commerce.json`);

  console.log('\n--- Testing Core API Operation ---');
  const rescueRes = await testEndpoint(`${BASE}/api/rescue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bootstrap' }),
  });
  console.log('Rescue API bootstrap response:', rescueRes.status);
}

run();
