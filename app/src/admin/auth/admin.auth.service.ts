import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

const PASSWORD_FILE = path.resolve(process.cwd(), "password.hash");

export async function isPasswordSet(): Promise<boolean> {
  try {
    await fs.access(PASSWORD_FILE);
    return true;
  } catch {
    return false;
  }
}

export async function setPassword(raw: string) {
  // Use bcryptjs sync helpers to avoid native modules.
  const hash = bcrypt.hashSync(raw, 10);
  await fs.writeFile(PASSWORD_FILE, hash, { mode: 0o600 });
}

export async function verifyPassword(raw: string): Promise<boolean> {
  const hash = await fs.readFile(PASSWORD_FILE, "utf-8");
  // Use bcryptjs sync helpers to avoid native modules.
  return bcrypt.compareSync(raw, hash);
}
