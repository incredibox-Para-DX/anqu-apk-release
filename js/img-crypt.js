/* 图片加密解析（PoC）：命中清单的图片从 .enc 解密为 Blob URL */
(function (w) {
    'use strict';
    var KEY = 'HEFUN_IMG_2026';
    // 需要解密的图片路径（相对路径，与 <img src> 一致）
    var ENC = {
        'images/img_b353ca7f64.png': 1,
        'images/400.png': 1,
        'images/PSU.png': 1
    };
    var cache = {};

    function xor(buf) {
        var bytes = new Uint8Array(buf), k = KEY, kl = k.length, out = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ k.charCodeAt(i % kl);
        return out;
    }
    function mimeOf(p) {
        if (/\.png$/i.test(p)) return 'image/png';
        if (/\.jpe?g$/i.test(p)) return 'image/jpeg';
        if (/\.webp$/i.test(p)) return 'image/webp';
        if (/\.gif$/i.test(p)) return 'image/gif';
        return 'application/octet-stream';
    }
    function resolveImg(path) {
        if (!path || !ENC[path]) return Promise.resolve(path);
        if (cache[path]) return Promise.resolve(cache[path]);
        return fetch(path + '.enc', { cache: 'no-store' })
            .then(function (r) { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); })
            .then(function (buf) {
                var url = URL.createObjectURL(new Blob([xor(buf)], { type: mimeOf(path) }));
                cache[path] = url;
                return url;
            })
            .catch(function () { return path; });
    }
    function normalize(src) {
        try {
            var u = new URL(src, location.href);
            var p = decodeURIComponent(u.pathname);
            var i = p.indexOf('/images/');
            if (i === -1) i = p.indexOf('/pictures/');
            return i === -1 ? '' : p.slice(i + 1);
        } catch (e) { return ''; }
    }
    function fixImg(img) {
        if (!img || img.__encFixed) return;
        var p = normalize(img.getAttribute('src') || '');
        if (!p || !ENC[p]) return;
        img.__encFixed = true;
        resolveImg(p).then(function (url) { if (url !== p) img.src = url; });
    }
    function scan(root) {
        var list = (root || document).querySelectorAll('img');
        for (var i = 0; i < list.length; i++) fixImg(list[i]);
    }
    function start() {
        scan(document);
        try {
            new MutationObserver(function (muts) {
                muts.forEach(function (m) {
                    if (m.type === 'attributes' && m.target.tagName === 'IMG') fixImg(m.target);
                    if (m.addedNodes) {
                        for (var i = 0; i < m.addedNodes.length; i++) {
                            var n = m.addedNodes[i];
                            if (n.tagName === 'IMG') fixImg(n);
                            else if (n.querySelectorAll) scan(n);
                        }
                    }
                });
            }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
        } catch (e) {}
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();

    w.ImgCrypt = { resolve: resolveImg, scan: scan, enc: ENC };
})(window);
