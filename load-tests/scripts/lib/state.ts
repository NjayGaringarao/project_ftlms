import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(dirname(fileURLToPath(import.meta.url)));
const stateDir = join(scriptsDir, "..", ".state");

const ensureStateDir = () => {
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
};

export const statePath = (name: string) => join(stateDir, name);

export const readState = <T>(name: string): T | null => {
  const path = statePath(name);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
};

export const writeState = <T>(name: string, value: T): void => {
  ensureStateDir();
  writeFileSync(statePath(name), JSON.stringify(value, null, 2), "utf-8");
};
