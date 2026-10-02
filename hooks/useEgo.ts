import { useEffect, useState } from "react";
import { TransportResponse } from "../types/transport";

type Result<T> = {
  key: string;
  identity: string;
  data?: TransportResponse<T>;
  error?: string;
};
export function useEgo<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<TransportResponse<T>>,
  { active = true, epoch = 0, pollMs = 0, retainWhileRefreshing = false } = {},
) {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result<T>>({ key: "", identity: "" });
  const identity = `${key}:${epoch}`;
  const requestKey = `${key}:${epoch}:${retry}`;
  useEffect(() => {
    if (!key || !active) return;
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, identity, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            identity,
            error: error instanceof Error ? error.message : "Veri alınamadı.",
          });
      });
    return () => controller.abort();
    // Parameters are encoded in key; load closures need no request restart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, active]);
  useEffect(() => {
    if (!key || !active || !pollMs) return;
    const timer = setInterval(() => setRetry((value) => value + 1), pollMs);
    return () => clearInterval(timer);
  }, [key, active, pollMs]);
  return {
    data:
      result.key === requestKey ||
      (retainWhileRefreshing && result.identity === identity)
        ? result.data
        : undefined,
    error: result.key === requestKey ? result.error : undefined,
    loading: !!key && active && result.key !== requestKey,
    retry: () => setRetry((value) => value + 1),
  };
}
