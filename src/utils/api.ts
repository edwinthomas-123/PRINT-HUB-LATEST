/**
 * Safe JSON parsing utilities to prevent syntax errors like:
 * "Unexpected token '<', "<!doctype "... is not valid JSON"
 */

export async function parseResponseJson<T = any>(
  res: Response,
  fallbackError = 'Request failed'
): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!contentType.includes('application/json') && text.trim().startsWith('<')) {
    throw new Error(
      `Server returned unexpected HTML response (${res.status} ${res.statusText || 'Error'}). Please check the server logs.`
    );
  }

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err: any) {
    if (text.trim().startsWith('<')) {
      throw new Error(`Server returned HTML instead of JSON (${res.status}): ${res.statusText}`);
    }
    throw new Error(text || `${fallbackError} (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `${fallbackError} (${res.status})`);
  }

  return data as T;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError = 'Request failed'
): Promise<{ ok: boolean; data: T | null; error: string | null; status: number }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!contentType.includes('application/json') && text.trim().startsWith('<')) {
      return {
        ok: false,
        data: null,
        error: `Server returned HTML instead of JSON (${res.status} ${res.statusText || ''})`,
        status: res.status
      };
    }

    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        data: null,
        error: text || `Invalid JSON response from server (${res.status})`,
        status: res.status
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        data: parsed,
        error: parsed?.error || parsed?.message || fallbackError,
        status: res.status
      };
    }

    return {
      ok: true,
      data: parsed as T,
      error: null,
      status: res.status
    };
  } catch (err: any) {
    return {
      ok: false,
      data: null,
      error: err.message || 'Network request failed',
      status: 0
    };
  }
}
