export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequest = {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retry?: { attempts: number; baseDelayMs: number };
};

export class HttpError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

const defaultTimeoutMs = 12_000;
const defaultRetry = { attempts: 2, baseDelayMs: 400 };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function withJitter(ms: number) {
  const jitter = Math.floor(Math.random() * 120);
  return ms + jitter;
}

async function parseJsonSafe(resp: Response) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function isAbortError(e: unknown) {
  if (!e || typeof e !== 'object') return false;
  const err = e as { name?: unknown; code?: unknown; message?: unknown };
  return (
    err.name === 'AbortError' ||
    err.code === 'ABORT_ERR' ||
    (typeof err.message === 'string' && err.message.toLowerCase().includes('abort'))
  );
}

export async function http<T>(req: HttpRequest): Promise<T> {
  const timeoutMs = req.timeoutMs ?? defaultTimeoutMs;
  const retry = req.retry ?? defaultRetry;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(req.body ? { 'Content-Type': 'application/json' } : {}),
    ...(req.headers ?? {}),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= retry.attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(req.url, {
        method: req.method,
        headers,
        body: req.body ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });

      const data = await parseJsonSafe(resp);
      if (!resp.ok) {
        let errorMsg = `Request failed with status ${resp.status}`;
        // Try to extract error message from response data
        if (data && typeof data === 'object') {
          if (typeof data.message === 'string' && data.message.trim() !== '') {
            errorMsg = data.message;
          } else if (typeof (data as any).error === 'string') {
            errorMsg = (data as any).error;
          }
        }
        const err = new HttpError(
          errorMsg,
          resp.status,
          data ?? undefined
        );
        if (attempt < retry.attempts && isRetryableStatus(resp.status)) {
          await sleep(withJitter(retry.baseDelayMs * (attempt + 1)));
          continue;
        }
        throw err;
      }

      return data as T;
    } catch (e) {
      lastError = e;
      if (attempt < retry.attempts && isAbortError(e)) {
        await sleep(withJitter(retry.baseDelayMs * (attempt + 1)));
        continue;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network error');
}
