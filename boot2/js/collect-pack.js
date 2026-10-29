/* 收藏室资源包：从 Gitee 等线路下载 collect 图片到 IndexedDB，收藏室需先下载才能查看 */
(function (w) {
    'use strict';
    var MANIFEST_URLS = [
        'https://gitee.com/HeFunovo/anqu-collect-resources/raw/master/manifest.json',
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/manifest.json',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/manifest.json',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-collect-resources/main/manifest.json'
    ];
    var BASE_URLS = [
        'https://gitee.com/HeFunovo/anqu-collect-resources/raw/master/',
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-collect-resources/main/'
    ];
    var DONE_KEY = 'ab_collect_pack_v1';
    var state = { manifest: null, downloading: false, paused: false };

    function $(id) { return document.getElementById(id); }
    function toast(m) { if (w.showToast) w.showToast(m); }
    function rdm() { return w.ResourceDownloadManager; }

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

    function isDone() {
        try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; }
    }

    function totalOf(m) { return (m && m.files) ? m.files.length : 0; }

    function setCount(done, total) {
        var el = $('rd-collect-count'); if (el) el.textContent = done + ' / ' + total;
    }
    function setBar(pct, text) {
        var bar = $('rd-collect-progress-bar'); if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
        if (text != null) { var t = $('rd-collect-progress-text'); if (t) t.textContent = text; }
    }
    function showProgress(show) { var w2 = $('rd-collect-progress-wrap'); if (w2) w2.style.display = show ? '' : 'none'; }
    function showDone(show) { var d = $('rd-collect-done'); if (d) d.style.display = show ? '' : 'none'; }

    function refreshUI() {
        var done = isDone();
        showDone(done);
        var btn = $('rd-download-collect-btn');
        if (btn) btn.style.display = done ? 'none' : '';
        if (done) {
            loadManifest().then(function (m) { setCount(totalOf(m), totalOf(m)); }).catch(function () {});
        }
    }

    function download() {
        var R = rdm();
        if (!R) { toast('资源管理器未就绪，请稍后再试'); return; }
        if (state.downloading) { state.paused = !state.paused; var b = $('rd-download-collect-btn'); if (b) b.innerHTML = state.paused ? '<i class="fas fa-play"></i> 继续下载' : '<i class="fas fa-pause"></i> 暂停下载'; return; }
        loadManifest().then(function (m) {
            var files = (m.files || []).filter(function (f) { return f && f.path; });
            if (!files.length) { toast('收藏室资源列表加载失败，请检查网络'); return; }
            state.downloading = true; state.paused = false;
            var btn = $('rd-download-collect-btn'); if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> 暂停下载';
            showProgress(true); showDone(false); setCount(0, files.length); setBar(0, '开始下载…');
            var done = 0, failed = 0;
            R._runConcurrentPool(files, function (f) {
                return R.waitWhilePaused(function () { return state.paused; }).then(function () {
                    var urls = BASE_URLS.map(function (b) { return b + f.path; });
                    return R.downloadFile(urls, f.path, f.path, f.size || 0, null, function () { return state.paused; });
                });
            }, function () {
                done++; setCount(done + failed, files.length);
                setBar(Math.round((done + failed) / files.length * 100), '已完成 ' + done + '/' + files.length);
            }, function () { failed++; setCount(done + failed, files.length); }, 6).then(function () {
                state.downloading = false;
                if (btn) btn.innerHTML = '<i class="fas fa-download"></i> 下载收藏室资源包';
                var total = files.length;
                if (failed === 0) {
                    try { localStorage.setItem(DONE_KEY, m.version || '1'); } catch (e) {}
                    setBar(100, '全部完成'); showDone(true);
                    var b2 = $('rd-download-collect-btn'); if (b2) b2.style.display = 'none';
                    toast('收藏室资源包已下载完成');
                } else {
                    setBar(Math.round(done / total * 100), '完成：' + done + '/' + total + '，失败 ' + failed + '（可再次点击重试）');
                    toast('部分失败，可再次点击重试');
                }
            });
        }).catch(function () { toast('收藏室资源列表加载失败，请检查网络'); });
    }

    function bind() {
        var b = $('rd-download-collect-btn');
        if (b && !b._b) { b._b = true; b.addEventListener('click', download); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bind(); refreshUI(); });
    else { bind(); refreshUI(); }

    w.CollectPack = { download: download, isDone: isDone, loadManifest: loadManifest, refreshUI: refreshUI };
})(window);
