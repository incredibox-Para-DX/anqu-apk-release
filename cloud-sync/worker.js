















export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const code = (url.pathname.replace(/^\/+/, '') || '').toUpperCase();

    if (!/^[A-Z0-9]{12}$/.test(code)) {
      return json({ error: 'invalid code' }, 400, cors);
    }

    if (request.method === 'GET') {
      const raw = await env.SYNC_KV.get(code);
      if (!raw) return json({ error: 'not found' }, 404, cors);
      return new Response(raw, {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'PUT') {
      const body = await request.text();
      if (body.length > 64 * 1024) {
        return json({ error: 'too large' }, 413, cors);
      }
      try {
        JSON.parse(body);
      } catch (e) {
        return json({ error: 'invalid json' }, 400, cors);
      }
      await env.SYNC_KV.put(code, body);
      return json({ ok: true }, 200, cors);
    }

    return json({ error: 'method not allowed' }, 405, cors);
  }
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
