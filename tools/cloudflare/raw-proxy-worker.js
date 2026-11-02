












const OWNER = 'incredibox-Para-DX';
const REPO = 'anqu-apk-release';
const UPSTREAM = 'https://raw.githubusercontent.com';
const AVATAR_OWNER = 'incredibox-Para-DX';
const AVATAR_REPO = 'anqu-collect-resources';
const AVATAR_DIR = 'avatars';
const AVATAR_MAX = 2 * 1024 * 1024;

const REF_RE = /^(main|dev|p-[a-z0-9-]+)$/i;
const AVATAR_RE = /^\/avatar\/([A-Za-z0-9_-]{1,64})$/;

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-avatar-key',
      'Cache-Control': 'no-store'
    }
  });
}

function base64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function uploadAvatar(request, uid, env) {
  if (!env || !env.GH_TOKEN) return json({ error: 'GH_TOKEN not configured' }, 503);
  if (env.AVATAR_KEY && request.headers.get('x-avatar-key') !== env.AVATAR_KEY) {
    return json({ error: 'forbidden' }, 403);
  }
  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length || buf.length > AVATAR_MAX) return json({ error: 'bad size' }, 413);
  const sig = String.fromCharCode(buf[0], buf[1], buf[2], buf[3]);
  const isPng = buf[0] === 0x89 && sig.slice(1) === 'PNG';
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
  const isWebp = sig === 'RIFF' && String.fromCharCode(buf[8], buf[9], buf[10], buf[11]) === 'WEBP';
  const isGif = sig === 'GIF8';
  if (!isPng && !isJpg && !isWebp && !isGif) return json({ error: 'not an image' }, 415);
  const ext = isGif ? 'gif' : (isJpg ? 'jpg' : (isWebp ? 'webp' : 'png'));

  const api = `https://api.github.com/repos/${AVATAR_OWNER}/${AVATAR_REPO}/contents/${AVATAR_DIR}/${uid}.${ext}`;
  const headers = {
    'Authorization': 'token ' + env.GH_TOKEN,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'anqu-avatar'
  };
  let sha = null;
  const get = await fetch(api, { headers });
  if (get.ok) {
    try { sha = (await get.json()).sha; } catch (e) {}
  }
  const put = await fetch(api, {
    method: 'PUT',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    body: JSON.stringify({
      message: 'avatar ' + uid,
      content: base64(buf),
      ...(sha ? { sha } : {})
    })
  });
  if (!put.ok) {
    return json({ error: 'github upload failed', status: put.status }, 502);
  }
  return json({
    url: `https://cdn.jsdelivr.net/gh/${AVATAR_OWNER}/${AVATAR_REPO}@main/${AVATAR_DIR}/${uid}.${ext}?v=${Date.now()}`
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-avatar-key'
        }
      });
    }

    const avatarMatch = AVATAR_RE.exec(url.pathname);
    if (request.method === 'POST' && avatarMatch) {
      return uploadAvatar(request, avatarMatch[1], env);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    let path = url.pathname.replace(/^\/+|\/+$/g, '');
    if (!path || path.indexOf('..') !== -1) {
      return new Response('Not Found', { status: 404 });
    }

    const segs = path.split('/');
    let ref = 'main';
    
    if (segs.length >= 4 && segs[0] === OWNER && segs[1] === REPO && REF_RE.test(segs[2])) {
      ref = segs[2];
      path = segs.slice(3).join('/');
    } else if (REF_RE.test(segs[0])) {
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
