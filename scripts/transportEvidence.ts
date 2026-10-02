import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type Evidence = { text: string; fetchedAt: string };
export async function atomicWriteJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", "utf8");
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export class EvidenceCache {
  private memory = new Map<string, Evidence>();
  requests = 0;
  constructor(
    private options: {
      directory: string;
      now: () => Date;
      ttlMs: number;
      refresh?: boolean;
      offline?: boolean;
      maxRequests?: number;
    },
  ) {}
  async get(key: string, load: () => Promise<string>): Promise<Evidence> {
    if (!/^[a-z0-9-]+$/i.test(key)) throw new Error("Invalid evidence key");
    const memory = this.memory.get(key);
    if (memory) return memory;
    const path = join(this.options.directory, `${key}.evidence.json`);
    let cached: Evidence | undefined;
    try {
      const value: unknown = JSON.parse(await readFile(path, "utf8"));
      if (
        value &&
        typeof value === "object" &&
        "text" in value &&
        "fetchedAt" in value &&
        typeof value.text === "string" &&
        typeof value.fetchedAt === "string" &&
        Number.isFinite(Date.parse(value.fetchedAt))
      )
        cached = { text: value.text, fetchedAt: value.fetchedAt };
    } catch {
      /* Missing or corrupt evidence cannot establish freshness. */
    }
    const age = cached
      ? this.options.now().getTime() - Date.parse(cached.fetchedAt)
      : Infinity;
    if (
      cached &&
      !this.options.refresh &&
      age >= 0 &&
      age < this.options.ttlMs
    ) {
      this.memory.set(key, cached);
      return cached;
    }
    if (this.options.offline) {
      if (!cached) throw new Error(`No timestamped evidence: ${key}`);
      // Offline rebuilding retains the real old timestamp, never today's date.
      this.memory.set(key, cached);
      return cached;
    }
    if (this.requests >= (this.options.maxRequests ?? 25))
      throw new Error("EGO request budget reached");
    this.requests += 1;
    const text = await load();
    const result = { text, fetchedAt: this.options.now().toISOString() };
    await atomicWriteJson(path, result);
    this.memory.set(key, result);
    return result;
  }
}

export function oldestEvidenceDate(timestamps: string[]): string {
  if (
    !timestamps.length ||
    timestamps.some((value) => !Number.isFinite(Date.parse(value)))
  )
    throw new Error("Missing source timestamp");
  const oldest = new Date(
    Math.min(...timestamps.map((value) => Date.parse(value))),
  );
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(oldest);
}
