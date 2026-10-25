import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(process.env.OUT_DIR ?? "out");
const port = Number(process.env.PORT ?? 4173);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveFile(pathname) {
  const cleanPath = decodeURIComponent(pathname.split("?")[0]);
  const relative = normalize(cleanPath).replace(/^([/\\])+/, "");
  const target = resolve(root, relative);

  if (target !== root && !target.startsWith(root + sep)) return null;
  if (!existsSync(target)) return null;

  const info = statSync(target);
  if (info.isFile()) return { file: target, status: 200 };
  if (!info.isDirectory()) return null;

  const index = join(target, "index.html");
  if (existsSync(index)) return { file: index, status: 200 };
  return null;
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  let result = resolveFile(url.pathname);

  if (!result && !extname(url.pathname)) {
    result = resolveFile(`${url.pathname.replace(/\/$/, "")}/index.html`);
  }
  if (!result && !extname(url.pathname)) {
    result = resolveFile(`${url.pathname}.html`);
  }

  const notFound = join(root, "404.html");
  if (!result) {
    if (!existsSync(notFound)) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    result = { file: notFound, status: 404 };
  }

  const extension = extname(result.file).toLowerCase();
  const headers = {
    "content-type": MIME_TYPES[extension] ?? "application/octet-stream",
    "cache-control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  };

  response.writeHead(result.status, headers);
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(result.file).pipe(response);
});

server.listen(port, () => {
  console.log(`Dashboard pessoal disponível em http://localhost:${port}`);
});
