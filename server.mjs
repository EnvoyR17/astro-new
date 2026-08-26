import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

async function proxyPlaces(url, res) {
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ items: [] }));
    return;
  }
  try {
    const upstream =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
      `&format=json&addressdetails=1&namedetails=1&limit=8`;
    const r = await fetch(upstream, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "theastrologist-quiz-clone/1.0 (railway)",
      },
    });
    const items = await r.json();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ items: Array.isArray(items) ? items : [] }));
  } catch (e) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(e), items: [] }));
  }
}

function sendFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
}

function serveSpa(reqPath, res) {
  const safe = path.normalize(decodeURIComponent(reqPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(dist, safe);
  if (!filePath.startsWith(dist)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(filePath, res);
    return;
  }
  const index = path.join(dist, "index.html");
  if (fs.existsSync(index)) {
    sendFile(index, res);
    return;
  }
  res.writeHead(404).end("Not found — run npm run build first");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (url.pathname === "/api/birth-profile/search-places") {
    await proxyPlaces(url, res);
    return;
  }
  serveSpa(url.pathname === "/" ? "/index.html" : url.pathname, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});
