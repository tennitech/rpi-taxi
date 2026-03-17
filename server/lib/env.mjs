import { readFileSync } from "node:fs";
import path from "node:path";

function parseEnvFile(contents) {
  const result = {};

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

export function loadLocalEnv(projectRoot) {
  const fileNames = [".env", ".env.local"];

  for (const fileName of fileNames) {
    const filePath = path.join(projectRoot, fileName);

    try {
      const parsed = parseEnvFile(readFileSync(filePath, "utf8"));
      for (const [key, value] of Object.entries(parsed)) {
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    } catch {
      continue;
    }
  }
}

