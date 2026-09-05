async function testAssets() {
  const res = await fetch('https://secondhop.vercel.app/dashboard');
  const html = await res.text();
  console.log('Dashboard HTML status:', res.status, 'length:', html.length);
  
  const scriptRegex = /src="(\/[^"]+)"/g;
  const linkRegex = /href="(\/[^"]+)"/g;
  const urls = new Set();
  
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    urls.add(m[1]);
  }
  while ((m = linkRegex.exec(html)) !== null) {
    urls.add(m[1]);
  }
  
  console.log(`Found ${urls.size} assets linked in HTML:`);
  let hasFailures = false;
  for (const asset of urls) {
    const assetUrl = 'https://secondhop.vercel.app' + asset;
    const aRes = await fetch(assetUrl);
    const ct = aRes.headers.get('content-type') || '';
    console.log(`[${aRes.status}] ${asset} (${ct})`);
    if (aRes.status !== 200) {
      hasFailures = true;
    }
  }
  if (!hasFailures) {
    console.log('All linked assets returned 200 OK!');
  }
}

testAssets().catch(console.error);
