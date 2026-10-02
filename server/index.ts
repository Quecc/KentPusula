import { createServer } from "node:http";
import { parseArrivals, parseLines, parseSchedule } from "./ego";

const port = Number(process.env.PORT || 8787);
const web = "https://www.ego.gov.tr";
const mobile = "https://egocptsrvand.ego.gov.tr/mblSrv14/service.asp";
const cache = new Map<string, { expires: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
async function cached(key: string, ttl: number, task: () => Promise<unknown>) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = inflight.get(key);
  if (pending) return pending;
  if (inflight.size >= 8)
    throw new Error("EGO bağlantısı yoğun. Biraz sonra tekrar dene.");
  const promise = task()
    .then((data) => {
      const value = {
        data,
        fetchedAt: new Date().toISOString(),
        source: key.startsWith("arrivals") ? mobile : `${web}/hareketsaatleri`,
      };
      if (cache.size >= 200) cache.delete(cache.keys().next().value!);
      cache.set(key, { value, expires: Date.now() + ttl });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
async function upstream(url: string, body?: string) {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${web}/hareketsaatleri`,
    },
    body,
    signal: AbortSignal.timeout(12000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 2_000_000) throw new Error("Yanıt çok büyük.");
  return text;
}
export const server = createServer(async (req, res) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "*",
  );
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end(JSON.stringify({ error: "Yalnızca GET desteklenir." }));
    return;
  }
  const path = new URL(req.url || "/", "http://localhost").pathname;
  try {
    let data: unknown;
    const line = path.match(
      /^\/v1\/lines\/(\d{2,4}(?:-\d{1,2})?)\/schedule$/,
    )?.[1];
    const stop = path.match(/^\/v1\/stops\/(\d{5})\/arrivals$/)?.[1];
    if (path === "/health")
      data = {
        status: "ok",
        note: "Proxy hazır; EGO erişilebilirliği istek sırasında kontrol edilir.",
      };
    else if (path === "/v1/lines")
      data = await cached("lines", 3600000, async () => {
        // EGO Mac's older AJAX endpoint currently returns 404. Read the live form.
        const html = await upstream(`${web}/HareketSaatleri`);
        const options = html.match(
          /<select\b[^>]*name=["']hat_no1["'][^>]*>([\s\S]*?)<\/select>/i,
        )?.[1];
        if (!options) throw new Error("Hat seçimi okunamadı.");
        return parseLines(options);
      });
    else if (line)
      data = await cached(`schedule:${line}`, 900000, async () =>
        parseSchedule(
          await upstream(
            `${web}/HareketSaatleri`,
            new URLSearchParams({ hat_no1: line }).toString(),
          ),
          line,
        ),
      );
    else if (stop)
      data = await cached(`arrivals:${stop}`, 20000, async () =>
        parseArrivals(
          JSON.parse(
            await upstream(
              `${mobile}?${new URLSearchParams({ FNC: "Otobusler", VER: "3.1.0", LAN: "tr", DURAK: stop })}`,
            ),
          ),
        ),
      );
    else {
      res.writeHead(404);
      res.end(
        JSON.stringify({
          error: "Geçerli bir hat veya 5 haneli durak numarası kullan.",
        }),
      );
      return;
    }
    res.end(JSON.stringify(data));
  } catch {
    res.writeHead(503);
    res.end(
      JSON.stringify({
        error: path.includes("arrivals")
          ? "EGO canlı araç servisine şu anda ulaşılamıyor. Varış dakikası gösterilemiyor; hareket saatlerine veya resmî EGO sayfasına bakabilirsin."
          : "EGO verisi şu anda okunamıyor. Biraz sonra tekrar dene veya resmî sayfayı aç.",
      }),
    );
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(`KentPusula ulaşım servisi: http://localhost:${port}`),
);
