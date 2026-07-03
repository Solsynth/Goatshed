import { snakeToCamel } from "~/utils/case";

interface SnApiFetchOptions extends RequestInit {
  token?: string;
}

export async function snFetch<T>(
  event: Parameters<typeof useRuntimeConfig>[0],
  path: string,
  options: SnApiFetchOptions = {},
): Promise<T> {
  const config = useRuntimeConfig(event);
  const baseUrl = config.public.apiBaseUrl;
  const headers = new Headers(options.headers || {});

  if (!headers.has("content-type") && options.body) {
    headers.set("content-type", "application/json");
  }

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[snFetch] Request failed:", {
      url,
      method: options.method || "GET",
      headers: Object.fromEntries(headers.entries()),
      body: options.body,
      status: response.status,
      response: text,
    });
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  if (response.status === 204) {
    return null as T;
  }

  const data = (await response.json()) as unknown;
  return snakeToCamel<T>(data);
}

export async function snFetchWithTotal<T>(
  event: Parameters<typeof useRuntimeConfig>[0],
  path: string,
  options: SnApiFetchOptions = {},
): Promise<{ data: T; total: number }> {
  const config = useRuntimeConfig(event);
  const headers = new Headers(options.headers || {});

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${config.public.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[snFetchWithTotal] Request failed:", {
      url: `${config.public.apiBaseUrl}${path}`,
      method: options.method || "GET",
      headers: Object.fromEntries(headers.entries()),
      body: options.body,
      status: response.status,
      response: text,
    });
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  const total = Number.parseInt(response.headers.get("x-total") || "0", 10);
  const raw = (await response.json()) as unknown;
  return { data: snakeToCamel<T>(raw), total };
}
