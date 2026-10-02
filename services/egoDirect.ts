import { parseArrivals, parseLines, parseSchedule } from "../server/ego";
import {
  Arrival,
  EgoLine,
  Schedule,
  TransportResponse,
} from "../types/transport";

const web = "https://www.ego.gov.tr/HareketSaatleri";
const mobile = "https://egocptsrvand.ego.gov.tr/mblSrv14/service.asp";

// Native requests do not require the browser's CORS proxy. Public EGO data
// stays available when the release APK is used away from the developer's PC.
async function official(url: string, signal?: AbortSignal, body?: string) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", abort);
  const timeout = setTimeout(abort, 16000);
  try {
    const response = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: web,
      },
      body,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`EGO HTTP ${response.status}`);
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error("EGO yanıtı okunamadı.");
    return text;
  } catch {
    throw new Error("EGO’ya şu an bağlanılamıyor. Biraz sonra tekrar dene.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
const envelope = <T>(data: T, source: string): TransportResponse<T> => ({
  data,
  source,
  fetchedAt: new Date().toISOString(),
});

export const directEgoProvider = {
  async lines(signal?: AbortSignal): Promise<TransportResponse<EgoLine[]>> {
    const html = await official(web, signal);
    const options = html.match(
      /<select\b[^>]*name=["']hat_no1["'][^>]*>([\s\S]*?)<\/select>/i,
    )?.[1];
    if (!options) throw new Error("EGO hat listesi okunamadı.");
    return envelope(parseLines(options), web);
  },
  async schedule(
    line: string,
    signal?: AbortSignal,
  ): Promise<TransportResponse<Schedule>> {
    if (!/^\d{2,4}(?:-\d{1,2})?$/.test(line))
      throw new Error("Geçerli bir hat numarası yaz.");
    const html = await official(
      web,
      signal,
      new URLSearchParams({ hat_no1: line }).toString(),
    );
    return envelope(parseSchedule(html, line), web);
  },
  async arrivals(
    stop: string,
    signal?: AbortSignal,
  ): Promise<TransportResponse<Arrival[]>> {
    if (!/^\d{5}$/.test(stop)) throw new Error("5 haneli durak numarası yaz.");
    const text = await official(
      `${mobile}?${new URLSearchParams({ FNC: "Otobusler", VER: "3.1.0", LAN: "tr", DURAK: stop })}`,
      signal,
    );
    return envelope(parseArrivals(JSON.parse(text)), mobile);
  },
};
