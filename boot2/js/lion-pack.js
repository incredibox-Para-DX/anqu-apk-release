(function (w) {
    'use strict';
    var MANIFEST_URLS = [
        'https://raw.hefunovo.xyz/incredibox-Para-DX/anqu-collect-resources/main/manifest.json',
        'https://anqu-raw2.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/manifest.json',
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/manifest.json',
        'https://fastly.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/manifest.json',
        'https://gcore.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/manifest.json',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/manifest.json',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-collect-resources/main/manifest.json'
    ];
    var BASE_URLS = [
        'https://raw.hefunovo.xyz/incredibox-Para-DX/anqu-collect-resources/main/',
        'https://anqu-raw2.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/',
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/',
        'https://fastly.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/',
        'https://gcore.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-collect-resources/main/'
    ];
    var DONE_KEY = 'ab_lion_pack_v1';
    var state = { manifest: null, downloading: false, base: null };

    function bt() { return w.AndroidUpdate; }
    function fileSize(p) {
        var b = bt();
        if (!b || typeof b.fileSize !== 'function') return -1;
        try { return Number(b.fileSize(p)) || 0; } catch (e) { return -1; }
    }

    function isDone() {
        var b = bt();
        if (b && typeof b.fileSize === 'function') {
            return fileSize('www/lion/lion.glb') > 0 && fileSize('www/lion/character.glb') > 0;
        }
        return true;
    }

    function loadManifest() {
        if (state.manifest) return Promise.resolve(state.manifest);
        var i = 0;
        return new Promise(function (resolve, reject) {
            function next() {
                if (i >= MANIFEST_URLS.length) { reject(new Error('manifest')); return; }
                var base = BASE_URLS[i];
                var url = MANIFEST_URLS[i++];
                fetch(url + '?t=' + Date.now(), { cache: 'no-store' })
                    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                    .then(function (m) {
                        var files = (m.files || []).filter(function (f) { return f.path.indexOf('lion/') === 0; });
                        if (!files.length) throw new Error('empty');
                        state.base = base;
                        state.manifest = { files: files, version: m.version || '1' };
                        resolve(state.manifest);
                    })
                    .catch(function () { next(); });
            }
            next();
        });
    }

    function b64(buf) {
        if (w.__huB64) return w.__huB64(buf);
        var bytes = new Uint8Array(buf), s = '', chunk = 0x8000;
        for (var i = 0; i < bytes.length; i += chunk) {
            s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(s);
    }

    function download() {
        if (state.downloading) return Promise.resolve();
        var b = bt();
        if (!b || typeof b.writeFile !== 'function') {
            if (w.showToast) w.showToast('当前安装包不支持写入资源，请安装新版 App');
            return Promise.resolve();
        }
        state.downloading = true;
        var doneEl = document.getElementById('rd-model-done');
        var barEl = document.getElementById('rd-model-progress-bar');
        var txtEl = document.getElementById('rd-model-progress-text');
        var wrapEl = document.getElementById('rd-model-progress-wrap');
        if (wrapEl) wrapEl.style.display = '';
        if (doneEl) doneEl.style.display = 'none';

        return loadManifest().then(function (m) {
            var files = m.files, total = files.length, done = 0;
            var base = state.base;
            function step(i) {
                if (i >= files.length) {
                    try { localStorage.setItem(DONE_KEY, m.version); } catch (e) {}
                    state.downloading = false;
                    if (wrapEl) wrapEl.style.display = 'none';
                    if (doneEl) doneEl.style.display = '';
                    if (w.showToast) w.showToast('模型资源包已下载完成');
                    return Promise.resolve();
                }
                var f = files[i];
                if (fileSize('www/' + f.path) === f.size) {
                    done++;
                    if (barEl) barEl.style.width = Math.round(done / total * 100) + '%';
                    if (txtEl) txtEl.textContent = done + ' / ' + total;
                    return step(i + 1);
                }
                return fetch(base + f.path, { cache: 'no-store' })
                    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
                    .then(function (buf) {
                        b.writeFile('www/' + f.path, b64(buf));
                        done++;
                        if (barEl) barEl.style.width = Math.round(done / total * 100) + '%';
                        if (txtEl) txtEl.textContent = done + ' / ' + total;
                        return step(i + 1);
                    })
                    .catch(function () {
                        state.downloading = false;
                        if (w.showToast) w.showToast('模型资源包下载失败，请检查网络后重试');
                    });
            }
            return step(0);
        });
    }

    function bind() {
        var btn = document.getElementById('rd-download-model-btn');
        if (btn) btn.addEventListener('click', function () { download(); });
        var del = document.getElementById('rd-delete-model-btn');
        if (del) del.addEventListener('click', function () {
            if (w.showConfirmDeletePaths) { w.showConfirmDeletePaths('模型资源包', function () {}); return; }
            if (w.showToast) w.showToast('请到热更新面板清理后重装');
        });
    }

    w.LionPack = { isDone: isDone, download: download, loadManifest: loadManifest };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
})(window);
