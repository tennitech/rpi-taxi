import { createServer } from "node:http";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const appDir = path.join(projectRoot, "RPI Taxi");
const fontsDir = path.join(projectRoot, "fonts");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function isSafePath(rootDir, candidatePath) {
  const relativePath = path.relative(rootDir, candidatePath);
  return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

async function tryRead(filePath) {
  await access(filePath);
  return readFile(filePath);
}

function serve(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function resolveAssetPath(urlPathname) {
  if (urlPathname === "/" || urlPathname === "") {
    return path.join(appDir, "index.html");
  }

  if (urlPathname === "/health") {
    return null;
  }

  if (urlPathname.startsWith("/fonts/")) {
    const candidate = path.resolve(projectRoot, `.${urlPathname}`);
    return isSafePath(fontsDir, candidate) ? candidate : null;
  }

  const candidate = path.resolve(appDir, `.${urlPathname}`);
  return isSafePath(appDir, candidate) ? candidate : null;
}

async function requestHandler(request, response) {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === "/health") {
    serve(response, 200, JSON.stringify({ ok: true }), {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  let filePath = resolveAssetPath(pathname);
  if (!filePath) {
    serve(response, 404, "Not found", {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    return;
  }

  try {
    let body = await tryRead(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = contentTypes[extension] ?? "application/octet-stream";
    const cacheControl = "no-store";

    serve(response, 200, body, {
      "Cache-Control": cacheControl,
      "Content-Type": contentType,
    });
  } catch {
    if (!path.extname(pathname)) {
      filePath = path.join(appDir, "index.html");
      try {
        const body = await tryRead(filePath);
        serve(response, 200, body, {
          "Cache-Control": "no-store",
          "Content-Type": contentTypes[".html"],
        });
        return;
      } catch {
        // Fall through to 404 below.
      }
    }

    serve(response, 404, "Not found", {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
  }
}

export { requestHandler };

export function startServer(options = {}) {
  const host = options.host ?? process.env.HOST ?? "127.0.0.1";
  const port = Number(options.port ?? process.env.PORT ?? 5000);
  const server = createServer(requestHandler);

  server.listen(port, host, () => {
    console.log(`RPI Taxi running at http://${host}:${port}`);
  });

  return server;
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  startServer();
}
