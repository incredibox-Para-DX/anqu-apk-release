/**
 * anqu-raw —— GitHub raw 反代 Worker（Cloudflare）
 *
 * 目的：国内直连 raw.githubusercontent.com 经常很慢甚至打不开，
 *      由 Cloudflare 边缘节点回源并缓存，客户端只和 CF 边缘通信。
 *
 * 路由：路径透传，首段是 ref（main 或 p-xxxx），其余是仓库内路径
 *   例：  /main/boot/js/script_new.js
 *    ->   https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot/js/script_new.js
 *   也支持不带 ref： /boot/js/script_new.js   -> 默认 main
 *
 * 部署：Cloudflare Dashboard -> Workers & Pages -> 创建 Worker -> 粘贴本文件
 *      名称填 anqu-raw，部署后地址为 https://anqu-raw.<你的子域>.workers.dev
 *
 * 缓存策略：manifest.json 30 秒，其余文件 120 秒。
 *          代码文件必须短缓存，否则发版后客户端会拿到旧代码导致版本误判。
 */

const OWNER = 'incredibox-Para-DX';
const REPO = 'anqu-apk-release';
const UPSTREAM = 'https://raw.githubusercontent.com';

// 允许的 ref：main 与私链灰度分支（p-xxxx）
const REF_RE = /^(main|p-[a-z0-9-]+)$/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 去掉首尾斜杠并阻断目录穿越
    let path = url.pathname.replace(/^\/+|\/+$/g, '');
    if (!path || path.indexOf('..') !== -1) {
      return new Response('Not Found', { status: 404 });
    }

    // 首段若是合法 ref 就用它，否则整体当作 main 下的路径
    const segs = path.split('/');
    let ref = 'main';
    if (REF_RE.test(segs[0])) {
      ref = segs[0];
      path = segs.slice(1).join('/');
      if (!path) return new Response('Not Found', { status: 404 });
    }

    const target = `${UPSTREAM}/${OWNER}/${REPO}/${ref}/${path}`;
    const isManifest = /(^|\/)manifest\.json$/i.test(path);

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers: {
          'User-Agent': 'anqu-raw-proxy',
          // 透传条件请求，让上游回 304 以节省流量
          ...(request.headers.get('If-None-Match')
            ? { 'If-None-Match': request.headers.get('If-None-Match') }
            : {}),
          ...(request.headers.get('Range')
            ? { Range: request.headers.get('Range') }
            : {})
        },
        cf: {
          cacheEverything: true,
          cacheTtl: isManifest ? 30 : 120
        }
      });
    } catch (e) {
      return new Response('Upstream Error: ' + e, { status: 502 });
    }

    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Cache-Control', isManifest ? 'public, max-age=30' : 'public, max-age=120');
    // 避免暴露 GitHub 的身份/限流信息
    headers.delete('set-cookie');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers
    });
  }
};
