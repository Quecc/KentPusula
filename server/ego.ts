import type { Arrival, EgoLine, Schedule } from "../types/transport";

// Parse only the public EGO page's known tables. A changed layout fails closed.
export function plain(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
      const n = code.startsWith("x")
        ? parseInt(code.slice(1), 16)
        : Number(code);
      return n <= 0x10ffff ? String.fromCodePoint(n) : "";
    })
    .replace(
      /&(amp|nbsp|quot|apos|lt|gt);/g,
      (_, key: string) =>
        ({ amp: "&", nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">" })[
          key
        ] ?? "",
    )
    .replace(/\s+/g, " ")
    .trim();
}
export function parseLines(html: string): EgoLine[] {
  const lines = [
    ...html.matchAll(
      /<option[^>]*value=["']([\d-]+)["'][^>]*>([\s\S]*?)<\/option>/gi,
    ),
  ]
    .map((m) => ({ code: m[1], name: plain(m[2]) }))
    .filter((l) => /^\d{2,4}(?:-\d{1,2})?$/.test(l.code));
  if (!lines.length) throw new Error("EGO hat listesi okunamadı.");
  return [...new Map(lines.map((l) => [l.code, l])).values()];
}
export function parseSchedule(html: string, line: string): Schedule {
  const field = (label: string) => {
    const row = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map((m) =>
        [...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
          plain(c[1]),
        ),
      )
      .find((c) => c[0] === label);
    return row?.[2] ?? "";
  };
  const cells = [
    ...html.matchAll(
      /<td\b[^>]*class=["'][^"']*hs-times[^"']*["'][^>]*>([\s\S]*?)<\/td>/gi,
    ),
  ];
  if (cells.length !== 3 || !field("Hat Adı"))
    throw new Error("EGO sefer sayfasının biçimi değişti veya hat bulunamadı.");
  const days = cells.map((cell, i) => ({
    label: ["Hafta içi", "Cumartesi", "Pazar"][i],
    departures: cell[1]
      .split(/<br\s*\/?\s*>/gi)
      .map(plain)
      .flatMap((row) => {
        const m = row.match(/^((?:[01]\d|2[0-3]):[0-5]\d)\s*(.*)$/);
        return m ? [{ time: m[1], note: m[2] === "-" ? "" : m[2] }] : [];
      }),
  }));
  const table =
    html.match(
      /<table\b[^>]*class=["'][^"']*route-table[^"']*["'][^>]*>([\s\S]*?)<\/table>/i,
    )?.[1] ?? "";
  const stops = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(
    (row) => {
      const c = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
        plain(m[1]),
      );
      return c.length >= 4 && /^\d+$/.test(c[0]) && /^\d{5}$/.test(c[1])
        ? [{ order: Number(c[0]), code: c[1], name: c[2], address: c[3] }]
        : [];
    },
  );
  return {
    line,
    name: field("Hat Adı"),
    origin: field("Kalkış Yeri"),
    destination: field("Varış Yeri"),
    days,
    stops,
  };
}
export function parseArrivals(input: unknown, now = Date.now()): Arrival[] {
  if (!input || typeof input !== "object")
    throw new Error("EGO yanıtı okunamadı.");
  const data = input as Record<string, unknown>;
  if (
    String(data.status).toUpperCase() !== "TRUE" ||
    !Array.isArray(data.table)
  )
    throw new Error("EGO bu durak için veri sağlayamadı.");
  const rows = data.table.flatMap((value: unknown) => {
    if (!value || typeof value !== "object") return [];
    const r = value as Record<string, unknown>;
    const str = (key: string) =>
      typeof r[key] === "string" ? r[key].trim() : "";
    const secondsText = str("saniye");
    const seconds = /^\d+$/.test(secondsText) ? Number(secondsText) : NaN;
    const description = str("sure");
    const descriptionLower = description.toLocaleLowerCase("tr-TR");
    if (
      seconds >= 999000 ||
      descriptionLower.includes("geçti") ||
      /bugün\s+için\s+(?:başka\s+servisi\s+yok|son\s+hareket\s+saati)/.test(
        descriptionLower,
      )
    )
      return [];
    const vehicle = str("arac_no");
    const plate = str("plaka_no");
    const updated = str("konum_tarihi");
    const parts = updated.match(
      /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2}:\d{2})$/,
    );
    const vehicleTime = parts
      ? Date.parse(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}+03:00`)
      : NaN;
    const age = now - vehicleTime;
    const live =
      vehicle !== "-" &&
      !!plate &&
      plate !== "-" &&
      age >= -60000 &&
      age <= 300000;
    const scheduled = vehicle === "-";
    const line = str("hat_kisa_kod") || str("hat_no") || str("hat_kod");
    if (!line) return [];
    return [
      {
        line,
        destination: str("hat_ad"),
        minutes:
          live && Number.isFinite(seconds) ? Math.ceil(seconds / 60) : null,
        kind: live
          ? ("live" as const)
          : scheduled
            ? ("scheduled" as const)
            : ("unknown" as const),
        description,
        vehicleUpdatedAt: updated || null,
      },
    ];
  });
  const rank = (row: Arrival) =>
    row.kind === "live" ? 0 : row.kind === "scheduled" ? 1 : 2;
  return rows.sort((a, b) => {
    const kind = rank(a) - rank(b);
    if (kind) return kind;
    if (a.kind === "live" && b.kind === "live")
      return (a.minutes ?? Infinity) - (b.minutes ?? Infinity);
    return a.line.localeCompare(b.line, "tr", { numeric: true });
  });
}
