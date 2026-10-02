import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function useTransportClock() {
  const [clock, setClock] = useState(() => Date.now());
  const [active, setActive] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      setActive(state === "active");
      setClock(Date.now());
      if (state === "active") setEpoch((value) => value + 1);
    });
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setClock(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [active]);
  return { clock, active, epoch };
}
