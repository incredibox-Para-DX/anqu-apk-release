/* GM 资源包：解锁 GM 后从资源下载下载，动态注入 GM 调试/管理工具；未解锁不显示下载项 */
(function (w) {
    'use strict';
    var MANIFEST_URLS = [
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-gm-resources@main/manifest.json',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-gm-resources/main/manifest.json',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-gm-resources/main/manifest.json'
    ];
    var BASE_URLS = [
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-gm-resources@main/',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-gm-resources/main/',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-gm-resources/main/'
    ];
    var DONE_KEY = 'ab_gm_pack_v1';
    var state = { manifest: null, downloading: false, paused: false };

    function $(id) { return document.getElementById(id); }
    function toast(m) { if (w.showToast) w.showToast(m); }
    function unlocked() { try { return localStorage.getItem('ab_gm_unlocked') === 'true'; } catch (e) { return false; } }
    function isDone() { try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; } }

    function loadManifest() {
        if (state.manifest) return Promise.resolve(state.manifest);
        var i = 0;
        return new Promise(function (resolve, reject) {
            function next() {
                if (i >= MANIFEST_URLS.length) { reject(new Error('manifest')); return; }
                var url = MANIFEST_URLS[i++];
                fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' })
                    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                    .then(function (m) { if (!m || !Array.isArray(m.files) || !m.files.length) throw new Error('bad'); state.manifest = m; resolve(m); })
                    .catch(function () { next(); });
            }
            next();
        });
    }

    function injectOnce() {
        if (w.__gmUiInjected) return;
        w.__gmUiInjected = true;
        try {
            var link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = 'debug-console.css';
            document.head.appendChild(link);
        } catch (e) {}
        ['js/gm-i18n.js', 'js/telemetry-dashboard.js'].forEach(function (src) {
            try {
                var s = document.createElement('script');
                s.src = src; s.async = false;
                document.body.appendChild(s);
            } catch (e) {}
        });
    }

    function refreshUI() {
        var block = $('rd-gm-block');
        if (block) block.style.display = unlocked() ? '' : 'none';
        if (unlocked() && isDone()) {
            var d = $('rd-gm-done'); if (d) d.style.display = '';
            var b = $('rd-download-gm-btn'); if (b) b.style.display = 'none';
            loadManifest().then(function (m) {
                var c = $('rd-gm-count'); if (c) c.textContent = m.files.length + ' / ' + m.files.length;
            }).catch(function () {});
        }
    }

    function download() {
        var R = w.ResourceDownloadManager;
        if (!R) { toast('资源管理器未就绪，请稍后再试'); return; }
        if (!unlocked()) { toast('未解锁 GM'); return; }
        if (state.downloading) {
            state.paused = !state.paused;
            var b0 = $('rd-download-gm-btn'); if (b0) b0.innerHTML = state.paused ? '<i class="fas fa-play"></i> 继续下载' : '<i class="fas fa-pause"></i> 暂停下载';
            return;
        }
        loadManifest().then(function (m) {
            var files = (m.files || []).filter(function (f) { return f && f.path; });
            if (!files.length) { toast('GM 资源列表加载失败，请检查网络'); return; }
            state.downloading = true; state.paused = false;
            var btn = $('rd-download-gm-btn'); if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> 暂停下载';
            var wp = $('rd-gm-progress-wrap'); if (wp) wp.style.display = '';
            var dn = $('rd-gm-done'); if (dn) dn.style.display = 'none';
            var done = 0, failed = 0;
            function setBar(pct, text) { var bar = $('rd-gm-progress-bar'); if (bar) bar.style.width = pct + '%'; if (text != null) { var t = $('rd-gm-progress-text'); if (t) t.textContent = text; } }
            function setCount() { var c = $('rd-gm-count'); if (c) c.textContent = (done + failed) + ' / ' + files.length; }
            setCount(); setBar(0, '开始下载…');
            R._runConcurrentPool(files, function (f) {
                return R.waitWhilePaused(function () { return state.paused; }).then(function () {
                    var urls = BASE_URLS.map(function (b) { return b + f.path; });
                    return R.downloadFile(urls, f.path, f.path, f.size || 0, null, function () { return state.paused; });
                });
            }, function () { done++; setCount(); setBar(Math.round((done + failed) / files.length * 100), '已完成 ' + done + '/' + files.length); },
                function () { failed++; setCount(); }, 6).then(function () {
                state.downloading = false;
                if (btn) btn.innerHTML = '<i class="fas fa-download"></i> 下载 GM 资源包';
                if (failed === 0) {
                    try { localStorage.setItem(DONE_KEY, m.version || '1'); } catch (e) {}
                    setBar(100, '全部完成'); if (dn) dn.style.display = '';
                    if (btn) btn.style.display = 'none';
                    injectOnce();
                    toast('GM 资源包已下载，GM 功能已启用');
                } else {
                    setBar(Math.round(done / files.length * 100), '完成：' + done + '/' + files.length + '，失败 ' + failed + '（可再次点击重试）');
                    toast('部分失败，可再次点击重试');
                }
            });
        }).catch(function () { toast('GM 资源列表加载失败，请检查网络'); });
    }

    function bind() {
        var b = $('rd-download-gm-btn');
        if (b && !b._b) { b._b = true; b.addEventListener('click', download); }
    }

    function init() {
        bind(); refreshUI();
        if (unlocked() && isDone()) injectOnce();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    w.GmPack = { download: download, isDone: isDone, refreshUI: refreshUI, injectOnce: injectOnce, unlocked: unlocked, loadManifest: loadManifest };
})(window);
