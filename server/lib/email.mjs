import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function sanitizeFilenamePart(value) {
  return String(value).replace(/[^a-z0-9]+/giu, "-").replace(/^-+|-+$/gu, "").toLowerCase();
}

export async function deliverVerificationCode({ email, code, outboxDir }) {
  const timestamp = new Date().toISOString();
  const safeEmail = sanitizeFilenamePart(email);
  const fileName = `${Date.now()}-${safeEmail}.txt`;
  const filePath = path.join(outboxDir, fileName);
  const payload = [
    `To: ${email}`,
    "Subject: Your RPI Taxi verification code",
    "",
    "Use this code to sign in to RPI Taxi:",
    "",
    `  ${code}`,
    "",
    "This code expires in 10 minutes.",
    "",
    `Generated: ${timestamp}`,
  ].join("\n");

  await mkdir(outboxDir, { recursive: true });
  await writeFile(filePath, payload, "utf8");

  return {
    method: "file",
    outboxFile: filePath,
  };
}
