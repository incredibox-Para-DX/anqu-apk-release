/**
 * 暗区突围保险模拟 · 云同步 Worker
 *
 * 部署步骤（网页版，无需命令行）：
 * 1. 打开 https://dash.cloudflare.com → 左侧「Workers & Pages」→「Create」
 * 2. 选择「Worker」→ 命名随意（如 anqu-sync）→ Deploy
 * 3. 进入刚创建的 Worker →「Edit code」，把本文件全部内容粘贴进去 → Deploy
 * 4. 返回 Worker 页面 →「Settings」→「Variables and Secrets」→
 *    添加 KV Namespace Binding：变量名必须填 SYNC_KV，选择「Create new namespace」新建一个
 * 5. 复制 Worker 的访问地址（形如 https://anqu-sync.xxx.workers.dev），填到客户端 SYNC_API
 *
 * 数据格式：
 *   PUT /<12位同步码>   body: {"data":{...},"updatedAt":1712345678901}
 *   GET /<12位同步码>   → 原样返回上面的 body
 */

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
