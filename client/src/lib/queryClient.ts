import { QueryClient, QueryFunction } from "@tanstack/react-query";
import * as localSim from "./local-sim";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Local sim fallback map for GET endpoints
const LOCAL_FALLBACKS: Record<string, () => unknown> = {
  "/api/services": () => localSim.getServices(),
  "/api/dashboard/stats": () => localSim.getDashboardStats(),
  "/api/scans": () => localSim.getScans(),
  "/api/chat": () => localSim.getChatMessages(),
  "/api/logs": () => localSim.getSystemLogs(),
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
    await throwIfResNotOk(res);
    return res;
  } catch {
    // Create a synthetic Response with local sim data for known endpoints
    const fallback = LOCAL_FALLBACKS[url];
    if (fallback) {
      return new Response(JSON.stringify(fallback()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`API unreachable: ${url}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/");
    try {
      const res = await fetch(`${API_BASE}${url}`);
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      await throwIfResNotOk(res);
      return await res.json();
    } catch {
      // Fallback to local sim
      const fallback = LOCAL_FALLBACKS[url];
      if (fallback) return fallback() as T;
      throw new Error(`API unreachable: ${url}`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
