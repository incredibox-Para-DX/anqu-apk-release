/**
 * anqu-raw —— GitHub raw 反代 Worker（Cloudflare）
 *
 * 目的：国内直连 raw.githubusercontent.com 经常很慢甚至打不开，
 *      由 Cloudflare 边缘节点回源并缓存，客户端只和 CF 边缘通信。
 *
 * 路由：路径透传
 *   格式：/<OWNER>/<REPO>/<ref>/<path>
 *   例：  /incredibox-Para-DX/anqu-bg-resources/main/images/bg1.jpg
 *    ->   https://raw.githubusercontent.com/incredibox-Para-DX/anqu-bg-resources/main/images/bg1.jpg
 *   也支持不带 ref（默认 main）： /incredibox-Para-DX/anqu-bg-resources/images/bg1.jpg
 *
 * 覆盖仓库：anqu-apk-release、anqu-bg-resources、anqu-music-resources、
 *           anqu-title-resources、anqu-minigame-resources
 *
 * 部署：Cloudflare Dashboard -> Workers & Pages -> 创建 Worker -> 粘贴本文件
 *      名称填 anqu-raw，部署后地址为 https://anqu-raw.<你的子域>.workers.dev
 *
 * 缓存策略：manifest.json 30 秒，其余文件 120 秒。
 *          代码文件必须短缓存，否则发版后客户端会拿到旧代码导致版本误判。
 */

const ALLOWED_REPOS = [
  'incredibox-Para-DX/anqu-apk-release',
  'incredibox-Para-DX/anqu-bg-resources',
  'incredibox-Para-DX/anqu-music-resources',
  'incredibox-Para-DX/anqu-title-resources',
  'incredibox-Para-DX/anqu-minigame-resources'
];

const UPSTREAM_BASE = 'https://raw.githubusercontent.com';

// 允许的 ref：main 与私链灰度分支（p-xxxx）
const REF_RE = /^(main|p-[a-z0-9-]+)$/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 解析路径：<owner>/<repo>/[<ref>/]<path>
    let path = url.pathname.replace(/^\/+|\/+$/g, '');
    if (!path || path.indexOf('..') !== -1) {
      return new Response('Not Found', { status: 404 });
    }

    const segs = path.split('/');
    if (segs.length < 2) {
      return new Response('Not Found', { status: 404 });
    }

    const owner = segs[0];
    const repo = segs[1];
    const repoKey = `${owner}/${repo}`;

    if (!ALLOWED_REPOS.includes(repoKey)) {
      return new Response('Repo not allowed', { status: 403 });
    }

    let ref = 'main';
    let filePath = '';
    if (segs.length >= 3 && REF_RE.test(segs[2])) {
      ref = segs[2];
      filePath = segs.slice(3).join('/');
    } else {
      filePath = segs.slice(2).join('/');
    }

    if (!filePath) {
      return new Response('Not Found', { status: 404 });
    }

    const target = `${UPSTREAM_BASE}/${owner}/${repo}/${ref}/${filePath}`;
    const isManifest = /(^|\\/)manifest\\.json$/i.test(filePath);

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers: {
          'User-Agent': 'anqu-raw-proxy',
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
    headers.delete('set-cookie');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers
    });
  }
};
