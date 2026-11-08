import { useState, useEffect } from "react";

const API = "http://localhost:3002";
const EVERY_MS = 4000; // how often the badge looks for new refund requests

// remembers the last number, so the badge does not blink when the center changes page
let lastCount = 0;

// Number of refund requests of a center that wait for an answer.
// It updates by itself (no refresh) and also right after a request is answered.
export default function usePendingRefunds(centerId) {
  const [count, setCount] = useState(lastCount);

  useEffect(() => {
    if (!centerId) return undefined;

    let stopped = false;

    const load = async () => {
      try {
        const res = await fetch(`${API}/refunds/center/${centerId}/pending-count`);
        const data = await res.json();
        if (!stopped && data.message === "success") {
          lastCount = Number(data.count) || 0;
          setCount(lastCount);
        }
      } catch (error) {
        /* the next check tries again */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };

    load();
    const timer = setInterval(onVisible, EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("refunds-changed", load);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("refunds-changed", load);
    };
  }, [centerId]);

  return count;
}