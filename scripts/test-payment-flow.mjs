import crypto from 'node:crypto';

const BASE = 'https://secondhop.vercel.app';

async function testPaymentFlow() {
  console.log('=== Step 1: Initial Session & Cookie ===');
  const getRes = await fetch(`${BASE}/api/rescue`);
  const getCookie = getRes.headers.get('set-cookie');
  console.log('GET /api/rescue status:', getRes.status);
  
  const cookieHeader = getCookie ? getCookie.split(';')[0] : '';
  const initialData = await getRes.json();
  console.log('testCheckoutAvailable:', initialData.testCheckoutAvailable);
  console.log('aiAvailable:', initialData.aiAvailable);
  console.log('parcels available:', initialData.parcels?.length);

  const parcel = initialData.parcels[0];
  console.log(`\n=== Step 2: Reserve Parcel ${parcel.id} (${parcel.title}) ===`);
  
  const reservePayload = {
    action: 'reserve',
    parcelId: parcel.id,
    budgetPaise: parcel.budgetPaise,
    radiusKm: parcel.radiusKm,
    courierPaise: parcel.economics.courierPaise,
    requestedVariant: parcel.requestedVariant,
    rail: 'razorpay_test',
    requestId: crypto.randomUUID(),
  };

  const reserveRes = await fetch(`${BASE}/api/rescue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
      'Origin': BASE,
    },
    body: JSON.stringify(reservePayload),
  });
  
  console.log('Reserve response status:', reserveRes.status);
  const reserveData = await reserveRes.json();
  console.log('Reserve response body:', reserveData);
  
  const caseId = reserveData?.caseId || reserveData?.result?.caseId;
  if (!caseId) {
    console.error('Failed to get caseId from reserve');
    return;
  }

  console.log(`\n=== Step 3: Create Razorpay Order for Case ${caseId} ===`);
  const orderRes = await fetch(`${BASE}/api/rescue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
      'Origin': BASE,
    },
    body: JSON.stringify({
      action: 'order',
      caseId: caseId,
    }),
  });
  
  console.log('Create order status:', orderRes.status);
  const orderData = await orderRes.json();
  console.log('Create order response:', orderData);
  
  console.log(`\n=== Step 4: Test Simulated Payment ===`);
  const simRes = await fetch(`${BASE}/api/rescue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
      'Origin': BASE,
    },
    body: JSON.stringify({
      action: 'simulate_payment',
      caseId: caseId,
    }),
  });
  
  console.log('Simulate payment status:', simRes.status);
  const simData = await simRes.json();
  console.log('Simulate payment response:', simData);
}

testPaymentFlow().catch(console.error);
