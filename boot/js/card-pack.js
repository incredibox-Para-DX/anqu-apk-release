/* 名片资源包：按需下载到 IndexedDB，避免占用代码包流量 */
(function (w) {
    'use strict';
    var MANIFEST_URLS = [
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/cards/manifest.json',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/cards/manifest.json',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-collect-resources/main/cards/manifest.json'
    ];
    var BASE_URLS = [
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-collect-resources/main/'
    ];
    var DONE_KEY = 'ab_card_pack_v1';
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

    function setCount(done, total) { var el = $('rd-card-count'); if (el) el.textContent = done + ' / ' + total; }
    function setBar(pct, text) {
        var bar = $('rd-card-progress-bar'); if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
        if (text != null) { var t = $('rd-card-progress-text'); if (t) t.textContent = text; }
    }
    function showProgress(show) { var w2 = $('rd-card-progress-wrap'); if (w2) w2.style.display = show ? '' : 'none'; }
    function showDone(show) { var d = $('rd-card-done'); if (d) d.style.display = show ? '' : 'none'; }

    function refreshUI() {
        var done = isDone();
        showDone(done);
        var btn = $('rd-download-card-btn'); if (btn) btn.style.display = done ? 'none' : '';
        var del = $('rd-delete-card-btn'); if (del) del.style.display = done ? '' : 'none';
        loadManifest().then(function (m) { var t = totalOf(m); setCount(done ? t : 0, t); }).catch(function () {});
    }

    function deletePack() {
        var R = w.ResourceDownloadManager;
        if (!R) { toast('资源管理器未就绪'); return; }
        loadManifest().then(function (m) {
            var paths = (m.files || []).map(function (f) { return f.path; });
            R.confirmDeletePaths('名片资源包', function () {
                R.deletePathsAndUnmark(paths).then(function () {
                    try { localStorage.removeItem(DONE_KEY); } catch (e) {}
                    toast('名片资源包已删除');
                    refreshUI();
                    if (w.Cards && w.Cards.refreshImages) w.Cards.refreshImages();
                });
            });
        }).catch(function () { toast('资源列表加载失败'); });
    }

    function download() {
        var R = rdm();
        if (!R) { toast('资源管理器未就绪，请稍后再试'); return; }
        if (state.downloading) { state.paused = !state.paused; var b = $('rd-download-card-btn'); if (b) b.innerHTML = state.paused ? '<i class="fas fa-play"></i> 继续下载' : '<i class="fas fa-pause"></i> 暂停下载'; return; }
        loadManifest().then(function (m) {
            var files = (m.files || []).filter(function (f) { return f && f.path; });
            if (!files.length) { toast('名片资源列表加载失败，请检查网络'); return; }
            state.downloading = true; state.paused = false;
            var btn = $('rd-download-card-btn'); if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> 暂停下载';
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
                if (btn) btn.innerHTML = '<i class="fas fa-download"></i> 下载名片资源包';
                if (failed === 0) {
                    try { localStorage.setItem(DONE_KEY, m.version || '1'); } catch (e) {}
                    setBar(100, '全部完成'); showDone(true);
                    var b2 = $('rd-download-card-btn'); if (b2) b2.style.display = 'none';
                    toast('名片资源包已下载完成');
                    if (w.Cards && w.Cards.refreshImages) w.Cards.refreshImages();
                } else {
                    setBar(Math.round(done / files.length * 100), '完成：' + done + '/' + files.length + '，失败 ' + failed + '（可再次点击重试）');
                    toast('部分失败，可再次点击重试');
                }
            });
        }).catch(function () { toast('名片资源列表加载失败，请检查网络'); });
    }

    function bind() {
        var b = $('rd-download-card-btn');
        if (b && !b._b) { b._b = true; b.addEventListener('click', download); }
        var d = $('rd-delete-card-btn');
        if (d && !d._b) { d._b = true; d.addEventListener('click', deletePack); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bind(); refreshUI(); });
    else { bind(); refreshUI(); }

    w.CardPack = { download: download, deletePack: deletePack, isDone: isDone, loadManifest: loadManifest, refreshUI: refreshUI };
})(window);
