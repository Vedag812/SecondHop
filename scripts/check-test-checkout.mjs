const base = 'http://localhost:3000';
const start = await fetch(base + '/api/rescue');
const workspace = await start.json();
console.log(
  JSON.stringify({
    testCheckoutConfigured: workspace.testCheckoutAvailable,
    aiConfigured: workspace.aiAvailable,
  }),
);
if (workspace.testCheckoutAvailable) {
  const response = await fetch(base + '/api/razorpay/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: start.headers.get('set-cookie').split(';')[0],
      Origin: base,
    },
    body: JSON.stringify({
      productId: 'prod_wh40_blue',
      mode: 'test',
      requestId: crypto.randomUUID(),
    }),
  });
  const result = await response.json();
  console.log(
    JSON.stringify({
      status: response.status,
      mode: result.mode,
      orderCreated: result.order?.id?.startsWith('order_'),
      amountPaise: result.order?.amount,
      error: result.error ?? null,
    }),
  );
}
