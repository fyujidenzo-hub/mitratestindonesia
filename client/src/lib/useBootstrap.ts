import { useEffect, useState } from "react";
import { api } from "./api";
import type { BootstrapData } from "../types";

let cached: BootstrapData | null = null;

export function useBootstrap() {
  const [data, setData] = useState<BootstrapData | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    api<BootstrapData>("/public/bootstrap")
      .then((result) => {
        cached = result;
        if (active) setData(result);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { data, loading };
}
