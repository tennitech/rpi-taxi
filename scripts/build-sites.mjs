import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDirectory = path.join(projectRoot, "dist");
const clientDirectory = path.join(distDirectory, "client");
const serverDirectory = path.join(distDirectory, "server");
const metadataDirectory = path.join(distDirectory, ".openai");

await rm(distDirectory, { force: true, recursive: true });
await Promise.all([
  mkdir(clientDirectory, { recursive: true }),
  mkdir(serverDirectory, { recursive: true }),
  mkdir(metadataDirectory, { recursive: true }),
]);

await Promise.all([
  cp(path.join(projectRoot, "RPI Taxi"), clientDirectory, { recursive: true }),
  cp(path.join(projectRoot, "fonts"), path.join(clientDirectory, "fonts"), {
    recursive: true,
  }),
  cp(path.join(projectRoot, "worker", "index.js"), path.join(serverDirectory, "index.js")),
  cp(
    path.join(projectRoot, ".openai", "hosting.json"),
    path.join(metadataDirectory, "hosting.json"),
  ),
]);

console.log("Built the Cloudflare Worker bundle in dist.");
