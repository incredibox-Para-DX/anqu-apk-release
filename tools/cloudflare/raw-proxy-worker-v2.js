





















const ALLOWED_REPOS = [
  'incredibox-Para-DX/anqu-apk-release',
  'incredibox-Para-DX/anqu-bg-resources',
  'incredibox-Para-DX/anqu-music-resources',
  'incredibox-Para-DX/anqu-title-resources',
  'incredibox-Para-DX/anqu-minigame-resources',
  'incredibox-Para-DX/anqu-mods-resources'
];

const UPSTREAM_BASE = 'https://raw.githubusercontent.com';


const REF_RE = /^(main|p-[a-z0-9-]+)$/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    
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
