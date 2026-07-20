import { useEffect, useState } from "react";
import { api } from "./api";
import type { BootstrapData } from "../types";

let cached: BootstrapData | null = null;

export function useBootstrap() {
  const [data, setData] = useState<BootstrapData | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    api<BootstrapData>("/public/bootstrap")
      .then((result) => {
        cached = result;
        setData(result);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
