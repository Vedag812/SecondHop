import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('.vercel/output');
const staticDir = path.join(outDir, 'static');
const funcDir = path.join(outDir, 'functions/server.func');

// Clean and create directories
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });
fs.mkdirSync(funcDir, { recursive: true });

// 1. Copy client assets to static/
const clientDist = path.resolve('dist/standalone/dist/client');
if (fs.existsSync(clientDist)) {
  fs.cpSync(clientDist, staticDir, { recursive: true });
  console.log('Copied client assets to static directory');
}

// Copy public directory to static/
const publicDir = path.resolve('public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, staticDir, { recursive: true });
  console.log('Copied public directory to static directory');
}

// 2. Write .vercel/output/config.json
const config = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/server' },
  ],
};
fs.writeFileSync(path.join(outDir, 'config.json'), JSON.stringify(config, null, 2));

// 3. Write function config
const vcConfig = {
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: true,
};
fs.writeFileSync(path.join(funcDir, '.vc-config.json'), JSON.stringify(vcConfig, null, 2));

// 4. Copy server bundle into server.func/dist/server
const serverDist = path.resolve('dist/standalone/dist/server');
const targetServerDist = path.join(funcDir, 'dist/server');
fs.mkdirSync(targetServerDist, { recursive: true });
fs.cpSync(serverDist, targetServerDist, { recursive: true });
console.log('Copied server bundle to function directory');

// Copy standalone node_modules into server.func/node_modules
const standaloneNodeModules = path.resolve('dist/standalone/node_modules');
if (fs.existsSync(standaloneNodeModules)) {
  fs.cpSync(standaloneNodeModules, path.join(funcDir, 'node_modules'), { recursive: true });
  console.log('Copied standalone node_modules to function directory');
}

// 5. Write package.json for ESM support (dist/server/index.js uses import syntax)
fs.writeFileSync(path.join(funcDir, 'package.json'), JSON.stringify({ type: 'module' }, null, 2));
console.log('Wrote package.json with type:module for ESM support');

// 6. Write server.func/index.mjs handler
const handlerCode = `
import workerEntry from './dist/server/index.js';

// Resolve the fetch handler — workerEntry IS the default export which has .fetch directly
const fetchHandler = workerEntry.fetch || workerEntry.default?.fetch;

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = protocol + '://' + host + req.url;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const reqInit = {
      method: req.method,
      headers,
    };
    if (body !== undefined) {
      reqInit.body = body;
      reqInit.duplex = 'half';
    }

    const webReq = new Request(url, reqInit);
    const webRes = await fetchHandler(webReq, process.env, {});

    res.statusCode = webRes.status;
    webRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    if (webRes.body) {
      const reader = webRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error('Server error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error: ' + err.message);
  }
}
`;
fs.writeFileSync(path.join(funcDir, 'index.mjs'), handlerCode.trim());

console.log('Vercel Build Output API v3 structure prepared successfully!');
