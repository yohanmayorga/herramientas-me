/* Cloudflare Pages Function · Proxy de verificación en tiempo real para enlaces de KoboToolbox (/api/check) */

const ALLOWED_ORIGIN = 'https://kf.kobo.iom.int';
const ALLOWED_PATH_RE = /^\/api\/v2\/assets\/[^/]+\/export-settings\/[^/]+\/data\.(csv|xlsx)$/i;
const TIMEOUT_MS = 20000;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export async function onRequestGet(context) {
  const reqUrl = new URL(context.request.url);
  const rawTarget = reqUrl.searchParams.get('url') || '';

  let target;
  try {
    target = new URL(rawTarget);
  } catch {
    return jsonResponse({ ok: false, error: 'URL inválida' }, 400);
  }

  if (target.origin !== ALLOWED_ORIGIN || !ALLOWED_PATH_RE.test(target.pathname)) {
    return jsonResponse({ ok: false, error: 'Solo se permiten enlaces de exportación de KoboToolbox' }, 403);
  }

  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, TIMEOUT_MS);

  const t0 = Date.now();

  try {
    const res = await fetch(target.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'Accept': '*/*'
      }
    });

    const contentType = res.headers.get('content-type') || '';
    const rawLen = res.headers.get('content-length');
    const contentLength = rawLen ? Number(rawLen) : null;

    let sampleBytes = 0;
    if (res.ok && res.body) {
      const reader = res.body.getReader();
      try {
        const firstChunk = await reader.read();
        if (firstChunk && firstChunk.value) {
          sampleBytes = firstChunk.value.byteLength;
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
    }

    clearTimeout(timer);
    const elapsedMs = Date.now() - t0;

    return jsonResponse({
      ok: res.ok && sampleBytes > 0,
      status: res.status,
      statusText: res.statusText || '',
      contentType,
      contentLength: Number.isFinite(contentLength) ? contentLength : null,
      sampleBytes,
      elapsedMs
    });
  } catch (err) {
    clearTimeout(timer);
    const elapsedMs = Date.now() - t0;
    return jsonResponse({
      ok: false,
      timedOut,
      status: timedOut ? 504 : 502,
      error: timedOut ? 'Tiempo de espera agotado (>20s)' : (err && err.message ? err.message : 'Error de conexión'),
      elapsedMs
    });
  }
}
