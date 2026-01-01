import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;

const mimeMap = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeMap[ext] || 'application/octet-stream';
}

async function serveFile(filePath, res) {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      return serveFile(path.join(filePath, 'index.html'), res);
    }

    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server Error');
  }
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(requestUrl.pathname);
  const safePath = path.normalize(path.join(root, pathname));

  if (!safePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  await serveFile(safePath, res);
});

const port = Number(process.env.PORT) || 4173;
server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
});
